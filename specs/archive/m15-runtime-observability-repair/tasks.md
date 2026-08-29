# M15 真实记录链与看板交付修复：执行任务

- **Template version**：`plan-task.v3`
- **任务状态**：`implementation repair in progress`；既有 build-code 修复已执行，当前仍需正常会话自动 outcome、step/skill 成本归因与最终 formal acceptance，不得写成完成。
- **spec binding**：`specs/m15-runtime-observability-repair/spec.md` sha256 `fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6`
- **plan binding**：`specs/m15-runtime-observability-repair/plan.md` sha256 `2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd`
- **执行口径**：所有任务都在同一当前 task 内按依赖顺序执行；历史数据只读；review 只记录异源建议，只有 build-code 做严格实现审查。
- **正常会话口径**：用户正常使用 WorkflowHub 的当前 Codex 会话就是执行入口；不要求用户另开或手动启动 Stage Agent。项目级 hook 登记精确 transcript，同一会话的私有事件命令记录 step/skill 边界，public run 自动调用现有 bridge/adapter；WorkflowHub runtime 不启动另一个 Agent。adapter 只经现有 `TaskKernel` 写入并绑定当前 snapshot/materials/manifest/spec-analyze。禁止 fixture、session 扫描、路径猜测和第二套 writer。外部项目不在本任务范围，禁止调用、修改、构建、测试或同步。

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

#### T001 — RED：正式成功 run 必须接入 canonical facts

- **ID**：T001
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：用正式 stage `run` 重现成功路径没有初始化 facts store、没有留下 source status 和 stage fact 的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001～R-004、R-008～R-009、D-001、D-003、PFACT-001、PFACT-002
- **输入**：隔离 storage、fresh task context、正式 `stage-runtime.mjs run` 输入和现有 stage outcome contract；不直接调用 sidecar 代替入口。
- **依赖**：无
- **并行**：否
- **FR**：FR-CHAIN-001 FR-CHAIN-002 FR-FACT-001 FR-E2E-001
- **AC**：AC-001 AC-002 AC-003 AC-010；fresh HTML 验收统一由 AC-010 负责。
- **动作**：第一步只读执行 fresh public `stage-runtime` `run`，保存 task/run/attempt/stage/session/source binding、Expected topology、facts→projection→HTML 读回、九个 failure domain/health 字段和 M10/M14b caller trace；第二步才新增会在成功 public run 后读取 task facts 的断言，核对入口是否真的没有初始化 facts store。registered source 和 resolver 缺失必须分别记录；证据不足走 unknown/incomplete 分支。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`tests/m15-monitoring-integration.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `tests/m15-monitoring-integration.test.mjs`
- **输出**：一条可复现的 RED 测试和失败 evidence，明确证明失败点是入口初始化/记录接入，不把失败解释成 workflow degradation。
- **Knowledge**：成功路径当前只在 sidecar 处读 facts；missing-outcome 分支已有初始化不能代表成功路径。
- **read_only_anchors**：`runtime/evidence/fact-collector.mjs`、`tools/cli/collect-task-facts.mjs`、`workflows/verify-code/metrics-writer.mjs`、`metrics/collector.mjs`、`config/transcript-sources.mjs`、`config/runtime-fact-sources.mjs`、`config/runtime-fact-v2-sources.mjs`
- **test tier**：fullstack-slice
- **test method**：`fullstack-slice-testing`；以 public `stageRuntimeCliMain`/`stage-runtime.mjs run` 为入口，禁止把直接 `runMonitoringSidecar` 当 primary proof；source caller 只读追踪。
- **scenarios**：SCN-001 fresh 正式入口；SCN-002 registered/unavailable source；SCN-006 source/projection error；SCN-010 facts 到 HTML 回放；M10/M14b caller presence/absence trace。
- **fixtures_services**：隔离 temp task/storage；authenticated stage outcome；真实 launcher resolver 能力若存在则使用，无能力则走无 resolver；历史 task 目录 sentinel；不使用 session 目录扫描。
- **coverage limits**：证明当前入口是否创建 fresh facts 和投影链；不把 fixture 当宿主 source 支持，不在本卡宣称浏览器交互或 M16 结果。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：1
- **oracle**：M15_ENTRY_CHAIN — public run 后能否读到同一 task 的 canonical facts 和 source status
- **evidence_path**：`quality/tests/build-code/m15-entry-chain/T001-red.json`
- **STOP**：若测试只能通过手工 initializeTaskStore、手工 sidecar 或历史 task，停止并改写场景为真实 public run。
- **recovery**：删除本卡新增的 failing assertion 不删除任何 task facts；保留 RED 输出，修复在 T002 完成。
- **task risk**：测试 fixture 可能误把直接 sidecar 当正式入口；必须在 oracle 中记录调用入口和 task identity。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：新增 fresh public `stage-runtime run` 断言；RED 真实复现成功路径读取 `facts.jsonl` 前未初始化事实存储。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（RED exit 1，`ENOENT facts.jsonl`）。
- **evidence_refs**：[`quality/tests/build-code/m15-entry-chain/T001-red.json`]
- **covered_ac**：`AC-001/002/003/010`：RED 证明入口链断点。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；当前 Phase review `unavailable`，配置加载失败，未产生 provider findings。
- **completed_at**：`2026-08-13T15:31:13+08:00`
- **执行事实**：RED 只证明旧成功入口未接入 canonical facts；没有把 source 不可用解释成 workflow 退化。

#### T002 — GREEN：正式成功 run 接入 canonical facts

- **ID**：T002
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：修复正式成功、失败和缺 outcome 路径的 task facts 初始化与 sidecar 连接，并保留原始 stage run 错误。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001～R-004、R-008～R-009、D-001、D-003、PFACT-001、PFACT-002
- **输入**：T001 RED、隔离 fresh task、正式 `stage-runtime.mjs run` 和既有 TaskStore append contract。
- **依赖**：T001
- **并行**：否
- **FR**：FR-CHAIN-001 FR-CHAIN-002 FR-FACT-001 FR-E2E-001
- **AC**：AC-001 AC-002 AC-003 AC-010；fresh HTML 验收统一由 AC-010 负责。
- **动作**：在正常 run 进入 sidecar 前初始化既有 facts store；统一成功/失败/missing-outcome 的 source status、stage fact、projection publish 和 stale fallback；将 source resolver 保持为 launcher 注入的私有能力。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`tests/m15-monitoring-integration.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `tests/m15-monitoring-integration.test.mjs`
- **输出**：同命令 GREEN；正式 run 后可读取同一 task 的 task/run/attempt/stage/source status/facts，执行错误仍向 caller 抛出。
- **Knowledge**：canonical facts 仍由 TaskStore append；不能把 projection 或 page 当 writer。
- **test tier**：fullstack-slice
- **test method**：`fullstack-slice-testing`；同 T001 的 public entry 和 source capability 分支，修复后用同一命令回放。
- **scenarios**：SCN-001 success/failure/missing-outcome；SCN-002 source status；SCN-006 stale/fatal fallback；SCN-010 fresh facts/projection/page binding。
- **fixtures_services**：T001 根因 evidence；隔离 TaskHandle/Workspace；private launcher resolver；失败注入只作用于 derived publish，不修改 facts。
- **coverage limits**：证明入口接入和错误保留；宿主没有真实 resolver 时只证明 unavailable/unknown 诚实落盘，不证明 transcript 全量采集。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_ENTRY_CHAIN — public run 后能否读到同一 task 的 canonical facts 和 source status
- **evidence_path**：`quality/tests/build-code/m15-entry-chain/T002-green.json`
- **STOP**：若为了 GREEN 增加 public record route、目录扫描、历史回填或第二 facts writer，立即停止并回到本卡设计边界。
- **recovery**：若 sidecar 发布失败，只发布 stale projection 并保留 facts；回滚限于 T002 的 P1 runtime/test 修改。
- **task risk**：初始化时机错误可能掩盖真实 run 失败；oracle 必须同时检查原始 run exit 和 monitoring evidence。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：正常成功 run 在 sidecar 前调用既有 `initializeTaskStore`；补齐 stage/source/quality 的当前 attempt 绑定回读。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（GREEN exit 0，3 files / 53 tests）。
- **evidence_refs**：[`quality/tests/build-code/m15-entry-chain/T002-green.json`]
- **covered_ac**：`AC-001/002/003/010`：通过；public run、facts 和 projection 可回读，source resolver 缺失诚实为 missing。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；当前 Phase review `unavailable`，不能据此宣称无严重问题。
- **completed_at**：`2026-08-13T15:31:13+08:00`
- **执行事实**：未增加 public record route、目录扫描或第二 facts writer；原始 stage run 结果仍由 caller 掌握。

#### T003 — RED：事实状态和来源能力必须可区分

- **ID**：T003
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：用 source 未登记、不可读、不支持、冲突、明确跳过和 topology 无 outcome 场景，重现旧六状态和批量 missing/unknown 的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-003、R-004、R-009、D-002、D-003、PFACT-002、PFACT-003、PFACT-008
- **输入**：注册 source reader、无 resolver、格式/版本错误、binding conflict、显式 step/skill outcomes 和 topology manifest。
- **依赖**：T002
- **并行**：否
- **FR**：FR-CHAIN-002 FR-FACT-001 FR-FACT-002
- **AC**：AC-002 AC-003 AC-004
- **动作**：先增加九种事实状态和显式适用性断言，验证没有 outcome 的 step/skill 不被自动当成已发生事件；验证 source reason、coverage、binding 和 value/reason 合同。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/monitoring-facts.mjs`、`runtime/schemas/monitoring-fact.v1.json`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `runtime/evidence/codex-transcript-adapter.mjs`; `runtime/evidence/monitoring-facts.mjs`; `runtime/schemas/monitoring-fact.v1.json`; `tests/m15-codex-transcript-adapter.test.mjs`; `tests/m15-monitoring-facts.test.mjs`; `tests/m15-monitoring-integration.test.mjs`
- **输出**：一条能失败的状态/来源 contract RED，失败信息区分事实状态混淆和记录缺口扩大。
- **Knowledge**：`partial`/`fatal` 属于 projection/UI 语义；source 未登记不能被默认为 present。
- **test tier**：backend-slice
- **test method**：`fullstack-slice-testing` 的 fact contract slice；先验证 stage producer 的 `unavailable`/`unknown`/`incomplete` 映射，再验证 adapter/schema。
- **scenarios**：SCN-002 source 未登记/不可读/不支持/冲突；SCN-004 适用 missing 与不适用事件；SCN-008 skipped/not_applicable；SCN-009 安全失败。
- **fixtures_services**：registered source reader、null resolver、格式/版本错误、binding mismatch、显式 step/skill outcomes、manifest topology；不读宿主 session 目录。
- **coverage limits**：只证明 facts 状态和绑定，不宣称 diagnostics、HTML 或真实 host 全量事件已支持。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：1
- **oracle**：M15_FACT_CONTRACT — 九状态、source binding、适用性和 reason 是否保持原始事实语义
- **evidence_path**：`quality/tests/build-code/m15-fact-contract/T003-red.json`
- **STOP**：若状态判断依赖页面文案、历史 snapshot 或未登记的本机路径，停止并回到 source contract。
- **recovery**：保留 RED 作为实现前基线；不修改历史 facts，不把旧 projection 改写成新事实。
- **task risk**：状态 enum 变严会暴露旧测试假设；只调整本轮 producer/contract 和 fresh fixture，不扩大兼容 writer。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：新增九状态、显式 outcome、binding 和 topology 无事件的 RED 断言；旧 enum/映射/批量合成场景真实失败。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（RED exit 1，3 个预期 contract 失败）。
- **evidence_refs**：[`quality/tests/build-code/m15-fact-contract/T003-red.json`]
- **covered_ac**：`AC-002/003/004`：RED 锁定事实状态和适用性缺口。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；当前 Phase review `unavailable`，RED 事实仍保留。
- **completed_at**：`2026-08-13T15:31:13+08:00`
- **执行事实**：RED 没有改历史事实；失败点是 producer/adapter/schema contract，不是页面文案。

#### T004 — GREEN：事实状态和来源能力诚实落盘

- **ID**：T004
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：让 adapter、stage producer、fact validator 和 schema 统一九种事实状态，按显式 outcome/适用性记录事件，并保留 source binding、coverage、reason 和 evidence ref。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-003、R-004、R-009、D-002、D-003、PFACT-002、PFACT-003、PFACT-008
- **输入**：T003 RED、既有 registered Codex source contract、stage outcome、manifest order 和 fact schema。
- **依赖**：T003
- **并行**：否
- **FR**：FR-CHAIN-002 FR-FACT-001 FR-FACT-002
- **AC**：AC-002 AC-003 AC-004
- **动作**：把未登记/不可读/不支持/冲突/不完整/合法跳过映射为明确事实状态和 reason；只有明确适用的事件才能进入 missing/乱序诊断所需事实；把 UI 的 partial/fatal 留给 projection。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/monitoring-facts.mjs`、`runtime/schemas/monitoring-fact.v1.json`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`、`tests/m15-monitoring-integration.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `runtime/evidence/codex-transcript-adapter.mjs`; `runtime/evidence/monitoring-facts.mjs`; `runtime/schemas/monitoring-fact.v1.json`; `tests/m15-codex-transcript-adapter.test.mjs`; `tests/m15-monitoring-facts.test.mjs`; `tests/m15-monitoring-integration.test.mjs`
- **输出**：同命令 GREEN；九状态、source identity、coverage、reason/value、evidence refs 和显式适用性都能从 facts 回读。
- **Knowledge**：source registry 为空不是生产支持证明；没有真实 host capability 时必须保留 unavailable/unsupported/unknown。
- **test tier**：backend-slice
- **test method**：`fullstack-slice-testing` 的 fact contract slice；同 T003 命令验证 stage producer、adapter 和 schema 同步。
- **scenarios**：SCN-002 六类 source 结果；SCN-004 missing 适用性；SCN-008 合法 skip；SCN-009 越界/权限错误。
- **fixtures_services**：T003 RED inputs；launcher private resolver；explicit applicability matrix；schema validator；无目录扫描服务。
- **coverage limits**：证明九状态与 reason/value contract；未证明的 host 事件仍保持 unavailable/unsupported/unknown，不把 schema GREEN 当 host GREEN。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_FACT_CONTRACT — 九状态、source binding、适用性和 reason 是否保持原始事实语义
- **evidence_path**：`quality/tests/build-code/m15-fact-contract/T004-green.json`
- **STOP**：若 GREEN 依赖把 unavailable 改成 missing、把 unknown 改成零或补造 step/skill outcome，停止并保留真实缺口。
- **recovery**：contract 发布失败时保持原 canonical facts 不变，回滚只涉及 P1 adapter/fact/schema/test 文件。
- **task risk**：适用性字段缺失会让诊断误报；oracle 要同时检查 source capability 和 event applicability 两个分母。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：统一 facts validator/schema/adapter/stage producer 到九种事实状态；只对显式 step/skill outcome 写事实；冲突、不可用、不支持和不完整保留 reason/error。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（GREEN exit 0，3 files / 53 tests）。
- **evidence_refs**：[`quality/tests/build-code/m15-fact-contract/T004-green.json`]
- **covered_ac**：`AC-002/003/004`：通过；未证明宿主能力仍保留 unavailable/unsupported/unknown。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；当前 Phase review `unavailable`，不把 GREEN 改写成 provider pass。
- **completed_at**：`2026-08-13T15:31:13+08:00`
- **执行事实**：`partial/fatal` 不再进入 canonical fact status；它们留给 derived diagnostics/projection。

#### T005 — RED：retry、重复事件和冲突必须保留身份

- **ID**：T005
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：重现 retry 复用 attempt、重复事件重复计数、同粒度冲突被静默择值和 fresh test 写入历史的风险。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001、R-004、R-008、D-003、D-004、PFACT-001、PFACT-004、PFACT-006
- **输入**：两个 attempt、相同 fact_id 的重复 transcript event、不同 source 的同粒度记录、fresh task storage 和历史 task 只读 sentinel。
- **依赖**：T004
- **并行**：否
- **FR**：FR-FACT-001 FR-FACT-002 FR-PROJ-001 FR-E2E-001
- **AC**：AC-003 AC-004 AC-009 AC-010；fresh HTML 验收统一由 AC-010 负责。
- **动作**：先增加 attempt isolation、fact-id idempotency、conflict preservation 和 no-history-write 断言，比较 facts hash 与目录快照。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/monitoring-facts.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `runtime/evidence/codex-transcript-adapter.mjs`; `runtime/evidence/monitoring-facts.mjs`; `tests/m15-monitoring-integration.test.mjs`; `tests/m15-codex-transcript-adapter.test.mjs`; `tests/m15-monitoring-facts.test.mjs`
- **输出**：一条能失败的 identity/idempotency RED 和 fresh/history boundary evidence。
- **Knowledge**：顺序只在同一 run_id+attempt_id 内判断；冲突不是质量通过，也不是简单相加。
- **test tier**：integration-slice
- **test method**：`fullstack-slice-testing`；以两个 fresh attempts、重复 event 和 conflict source 做最小回放。
- **scenarios**：SCN-007 concurrent/new-task boundary；SCN-008 retry/cancel/skip；SCN-010 facts hash；AC-009 history read-only sentinel。
- **fixtures_services**：隔离 temp storage；two authenticated attempts；duplicate fact ids；two explicit source ids；pre-existing history directory snapshot。
- **coverage limits**：只证明新任务身份/幂等/冲突和历史只读，不证明页面趋势或浏览器。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：1
- **oracle**：M15_IDENTITY — attempt、fact_id、conflict 和历史只读边界是否可回放
- **evidence_path**：`quality/tests/build-code/m15-identity/T005-red.json`
- **STOP**：若测试要删除或重写已有历史 facts 才能得到预期结果，停止并改用隔离 fresh task。
- **recovery**：保存 RED 的目录/hash 比较；不直接修正历史数据。
- **task risk**：重复事件和跨 attempt 的 fact key 可能互相覆盖；必须从 raw fact ids 和 attempt fields 做 oracle。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：新增 retry attempt 下 source status identity 断言；RED 真实复现 source status `fact_id` 未包含 attempt，第二次 attempt 被误过滤。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（RED exit 1，source status 只剩 attempt-a）。
- **evidence_refs**：[`quality/tests/build-code/m15-identity/T005-red.json`]
- **covered_ac**：`AC-003/004/009/010`：RED 锁定 attempt/source identity 缺口。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；当前 Phase review `unavailable`，身份修复证据已记录但未获严格审查结论。
- **completed_at**：`2026-08-13T15:31:13+08:00`
- **执行事实**：已有重复事件、冲突和跨 attempt token 测试；本次补出 source status 这一条遗漏。

#### T006 — GREEN：retry、重复事件和冲突保留身份

- **ID**：T006
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：修复 retry 的独立 attempt、同一 fact_id 幂等、冲突事实并存和 fresh-only 写入边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001、R-004、R-008、D-003、D-004、PFACT-001、PFACT-004、PFACT-006
- **输入**：T005 RED、两个 attempt、重复 source event、冲突 source、fresh storage 和历史 task sentinel。
- **依赖**：T005
- **并行**：否
- **FR**：FR-FACT-001 FR-FACT-002 FR-PROJ-001 FR-E2E-001
- **AC**：AC-003 AC-004 AC-009 AC-010；fresh HTML 验收统一由 AC-010 负责。
- **动作**：按 attempt_id 生成稳定 fact identity；重复 fact_id 不重复追加；不同来源冲突保留为 conflict；fresh test 只能追加当前 task facts，不能触碰历史目录。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/monitoring-facts.mjs`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `runtime/evidence/codex-transcript-adapter.mjs`; `runtime/evidence/monitoring-facts.mjs`; `tests/m15-monitoring-integration.test.mjs`; `tests/m15-codex-transcript-adapter.test.mjs`; `tests/m15-monitoring-facts.test.mjs`
- **输出**：同命令 GREEN；facts hash、fact count、attempt boundary、conflict refs 和历史目录 sentinel 均可回读。
- **Knowledge**：canonical facts append 是 authoritative；project/global rebuild 不能回写 facts。
- **test tier**：integration-slice
- **test method**：`fullstack-slice-testing`；同 T005 命令和 oracle，GREEN 必须比较 raw facts hash/count 与 history sentinel。
- **scenarios**：two attempts；same fact replay；cross-source conflict；derived publish failure；history directory unchanged。
- **fixtures_services**：T005 RED input；TaskStore lock；isolated projector output；history sentinel；无 destructive action 作用于真实 task。
- **coverage limits**：证明 fresh facts 的 append-only 和 identity contract；不处理历史、不推断 M16 经验价值。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_IDENTITY — attempt、fact_id、conflict 和历史只读边界是否可回放
- **evidence_path**：`quality/tests/build-code/m15-identity/T006-green.json`
- **STOP**：若为让 GREEN 通过而产生历史写入、静默丢 conflict 或复用旧 attempt，停止并保留失败事实。
- **recovery**：只回滚 P1 修改；fresh storage 可删除，历史 task 和 canonical facts 不删除。
- **task risk**：事实幂等不能误伤两个合法 source 的冲突；oracle 要验证 source identity 参与冲突判定。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：source status、missing source、malformed/binding/unsupported line 的 fact identity 纳入 run/attempt；重复 attempt 保留、同 attempt 仍幂等、冲突仍保留。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（GREEN exit 0，3 files / 53 tests）。
- **evidence_refs**：[`quality/tests/build-code/m15-identity/T006-green.json`]
- **covered_ac**：`AC-003/004/009/010`：通过；历史 task 未读写，宿主 source resolver 和并发进程竞态不在本 focused run 的证明范围。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；当前 Phase review `unavailable`，仍保留 source identity 和 host capability 限制。
- **completed_at**：`2026-08-13T15:31:13+08:00`
- **执行事实**：canonical facts 仍只有一个 writer；没有回填历史数据，也没有把冲突静默择值。

#### T007 — Phase 1 aggregate evidence：非行为汇总

- **ID**：T007
- **Phase**：Phase 1 — 正式入口与 canonical facts
- **goal**：汇总 P1 RED/GREEN、fresh entry、source capability、facts hash 和历史只读证据，供 P2 消费。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：D-001、D-002、D-003、D-004、FR-CHAIN-001、FR-FACT-001、FR-E2E-001
- **输入**：T001～T006 的执行 facts、RED/GREEN evidence、fresh task facts 和隔离目录快照。
- **依赖**：T006
- **并行**：否
- **FR**：FR-CHAIN-001 FR-CHAIN-002 FR-FACT-001 FR-FACT-002 FR-E2E-001
- **AC**：AC-001 AC-002 AC-003 AC-004 AC-009 AC-010；fresh HTML 验收统一由 AC-010 负责。
- **动作**：只汇总已产生的引用、hash、状态和缺口；不新增生产字段、不修改事实、不把 advisory review 改写成通过。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/monitoring-facts.mjs`、`runtime/schemas/monitoring-fact.v1.json`、`tests/m15-monitoring-integration.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`、`tests/m15-monitoring-facts.test.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`; `runtime/evidence/codex-transcript-adapter.mjs`; `runtime/evidence/monitoring-facts.mjs`; `runtime/schemas/monitoring-fact.v1.json`; `tests/m15-monitoring-integration.test.mjs`; `tests/m15-codex-transcript-adapter.test.mjs`; `tests/m15-monitoring-facts.test.mjs`
- **输出**：P1 aggregate evidence index，明确 present/unavailable/unknown/incomplete 和未解决 host gap。
- **Knowledge**：汇总不是第五份需求材料，也不是质量 gate；只保留 facts/evidence 原引用。
- **test tier**：aggregate
- **test method**：`fullstack-slice-testing` evidence aggregation；不新增运行时 writer，不替代 fresh/browser/verify evidence。
- **scenarios**：T001～T006 的 RED/GREEN；registered/unavailable source；attempt/conflict/history；root-cause caller trace。
- **fixtures_services**：只读 T001～T006 evidence refs、facts hashes、目录 snapshots 和 host capability facts。
- **coverage limits**：只证明 P1 evidence 可追溯；不把 aggregate 当独立 fresh run、浏览器或 review pass。
- **verification_role**：N/A — non-behavior aggregate records existing P1 evidence
- **paired_task**：N/A — aggregate verification has no behavior pair
- **gate_cmd**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_P1_AGGREGATE — P1 evidence refs、FR/AC 覆盖和 unresolved host facts 可追溯
- **evidence_path**：`quality/tests/build-code/m15-p1-aggregate.json`
- **STOP**：若 aggregate 只能用手工摘要替代命令和 evidence refs，停止并保留 incomplete。
- **recovery**：不改生产 facts；重新生成 aggregate evidence index 即可恢复。
- **task risk**：把 review/测试摘要写成产品事实会污染交接；只引用原始 evidence ref。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`in_progress`
- **actual_changes**：已汇总 P1 Phase Card、T001～T006 RED/GREEN 和 focused test 结果；当前 Phase review 已尝试但因审查配置加载失败而 unavailable。
- **executed_commands**：`npx vitest run tests/m15-monitoring-integration.test.mjs tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs --passWithNoTests=false`（exit 0，3 files / 53 tests）。
- **evidence_refs**：[`quality/tests/build-code/phase-1-card.json`, `quality/tests/build-code/m15-p1-aggregate.json`]
- **covered_ac**：`AC-001/002/003/004/009/010`：focused implementation evidence 已记录；当前 Phase review 待记录。
- **review_fact**：`quality/facts/1b6542938aca8926dbe25587a050ec69e0682e68f43aadb9834ccdf18e4468e2.json`；build-code `m15-entry-facts` strict review unavailable，设计阶段 review 仍只作异源建议。
- **completed_at**：
- **执行事实**：P1 代码和 focused tests 已完成；strict review 的 transport/config gap 已记录，未伪造“无严重 findings”。按同任务规则可继续安全实现 P2，但 P1 质量声明保持 incomplete。

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

#### T008 — RED：projection、诊断和样本分母必须完整

- **ID**：T008
- **Phase**：Phase 2 — projection、诊断与四区页面
- **goal**：重现当前 diagnostics 把记录缺口当退化、automation 没有固定分母、trend 小样本误报、projection 缺 view readiness 和 rebuild contract 的问题。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004、R-007、R-008、R-009、D-001、D-002、D-004、PFACT-003、PFACT-006、PFACT-007
- **输入**：T007 P1 evidence、typed facts、missing/unavailable/skipped/conflict/incomplete 样例、cost identity、health fields、兼容/不兼容 time buckets 和隔离派生 storage。
- **依赖**：T007
- **并行**：否
- **FR**：FR-VIEW-002 FR-DIAG-001 FR-COST-001 FR-PROJ-001 FR-HANDOFF-001；历史 alias `FR-VIEW-003 → FR-VIEW-002`、`FR-DIAG-003 → FR-DIAG-001`、`FR-COST-003 → FR-COST-001` 仅为当前 spec 的机械覆盖，不是活动 FR。
- **AC**：AC-004 AC-006 AC-007 AC-008 AC-009
- **动作**：先增加 projection schema、view required fields、in-scope task count、field coverage、sample sufficiency、automation denominator、trend minimum、nine failure domains、cost dedup 和 facts-preserving rebuild 断言。
- **精确文件**：`runtime/evidence/monitoring-diagnostics.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/schemas/monitoring-projection.v1.json`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`
- **boundary**：files: `runtime/evidence/monitoring-diagnostics.mjs`; `runtime/evidence/monitoring-projector.mjs`; `runtime/schemas/monitoring-projection.v1.json`; `tests/m15-monitoring-diagnostics.test.mjs`; `tests/m15-monitoring-projector.test.mjs`
- **输出**：一条能失败的 projection/diagnostics RED，包含错误分母、错误退化分类或缺字段的具体 assertion。
- **Knowledge**：`in_scope_task_count` 是范围事实，不是全库记录数；缺分母或字段身份时必须 unknown/insufficient。
- **test tier**：fullstack-slice
- **test method**：`fullstack-slice-testing`；以 T007 canonical facts 驱动 diagnostics/projector，单独检查 schema readback 和 rebuild。
- **scenarios**：SCN-004 已证明 missing 与 unavailable；SCN-005 cost/trend denominator；SCN-006 partial/stale/fatal；SCN-007 concurrent rebuild；SCN-010 delete-derived/rebuild/hash。
- **fixtures_services**：T007 facts；隔离 `Projects/<project>/monitoring/tasks/<task>.json`、project/global projection、`workflowhub-monitor-facts.jsonl`、`workflowhub-monitor-data.js`、`workflowhub-monitor.html`；health value 与 nine failure domains；不会删除 canonical facts。
- **coverage limits**：证明 projection/diagnostics contract 和 facts-preserving rebuild；不证明浏览器真实交互，不把单 task 或单 bucket 当趋势/常见。
- **verification_role**：RED
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`
- **expected_exit**：1
- **oracle**：M15_DIAGNOSTICS — failure domain、分母、sample sufficiency、cost identity 和 projection rebuild 是否保守正确
- **evidence_path**：`quality/tests/build-code/m15-diagnostics/T008-red-current.json`
- **STOP**：若 projection 需要读 HTML、旧 snapshot 或第二份 facts 才能算覆盖率，停止并回到 canonical fact boundary。
- **recovery**：保留 RED 输入和隔离派生物；不改 task facts，不回填历史。
- **task risk**：schema 变更可能遮蔽真实 runtime bug；先固定 oracle，再改 producer/validator。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：按原计划先固定 projection/diagnostics RED；未改动生产实现来制造失败。
- **executed_commands**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`；`exit=1`；37 passed、7 failed。
- **evidence_refs**：[`quality/tests/build-code/m15-diagnostics/T008-red-current.json`]
- **covered_ac**：AC-004、AC-006、AC-007、AC-008、AC-009（RED 暴露的缺口）
- **review_fact**：Phase 2 review 见 `quality/facts/5974125e7337611b8a3e8907dcea14dc707b77b8995f3572e90b547f56cf5d8d.json`，status=`unavailable`；review 只作为异源事实。
- **completed_at**：`2026-08-13T16:16:42+08:00`
- **执行事实**：RED 真实复现了 automation 分母、source unavailable 分类、未注册 source step、view readiness、empty_valid 和 `innerHTML` 缺口；页面缺口与 diagnostics 一起记录在同一 RED receipt，未另造失败记录。
- **执行事实**：发现原始 RED receipt 和早先的 canonical 副本都含非法字面量 `\\n`，均保留不覆盖；已通过 canonical writer 新增可回读的 `T008-red-current.json`，当前任务引用切到这份有效记录。

#### T009 — GREEN：projection、诊断和样本分母诚实可回读

- **ID**：T009
- **Phase**：Phase 2 — projection、诊断与四区页面
- **goal**：实现保守 diagnostics 和严格 projection contract，让每个视图显示固定范围、字段覆盖、样本状态、受控问题、成本拆分和可重建事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004、R-007、R-008、R-009、D-001、D-002、D-004、PFACT-003、PFACT-006、PFACT-007
- **输入**：T008 RED、P1 canonical facts、health contract、隔离 storage 和 rebuild sentinel。
- **依赖**：T008
- **并行**：否
- **FR**：FR-VIEW-002 FR-DIAG-001 FR-COST-001 FR-PROJ-001 FR-HANDOFF-001；历史 alias `FR-VIEW-003 → FR-VIEW-002`、`FR-DIAG-003 → FR-DIAG-001`、`FR-COST-003 → FR-COST-001` 仅为当前 spec 的机械覆盖，不是活动 FR。
- **AC**：AC-004 AC-006 AC-007 AC-008 AC-009
- **动作**：从 canonical facts 派生四视图 readiness；只让已证明适用的 missing/乱序/artifact mismatch 进入 degradation；固定 automation denominator、trend minimum、cost identity、nine domains 和 source/evidence refs；删除派生物后只从 facts 重建。
- **精确文件**：`runtime/evidence/monitoring-diagnostics.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/schemas/monitoring-projection.v1.json`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`
- **boundary**：files: `runtime/evidence/monitoring-diagnostics.mjs`; `runtime/evidence/monitoring-projector.mjs`; `runtime/schemas/monitoring-projection.v1.json`; `tests/m15-monitoring-diagnostics.test.mjs`; `tests/m15-monitoring-projector.test.mjs`
- **输出**：同命令 GREEN；projection schema 可验证，missing 与 unavailable 分层，count<2 不称常见，facts hash 前后一致，失败发布不改 facts。
- **Knowledge**：project/global/data.js/HTML 都是 derived；`partial`/`stale`/`fatal` 是投影或页面状态，不回写事实。
- **test tier**：fullstack-slice
- **test method**：`fullstack-slice-testing`；同 T008 command/oracle，GREEN 必须比较 facts hash、projection bytes/semantic value 和 failure-no-write。
- **scenarios**：SCN-004 degradation gating；SCN-005 cost/trend；SCN-006 error state；SCN-007 concurrent publish；SCN-010 derived deletion and rebuild。
- **fixtures_services**：T008 RED input；isolated storage；explicit source/evidence refs；project/global rebuild lock；failure injection only at derived publish。
- **coverage limits**：证明 projection schema、分母和重建语义；页面仍需 T010/T011 contract 和 browser QA，宿主 capability 不由 projector 补齐。
- **verification_role**：GREEN
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_DIAGNOSTICS — failure domain、分母、sample sufficiency、cost identity 和 projection rebuild 是否保守正确
- **evidence_path**：`quality/tests/build-code/m15-diagnostics/T009-green.json`
- **STOP**：若为了显示完整而把 unknown/unavailable/unsupported/incomplete 转成零、missing 或 success，停止并保留不完整状态。
- **recovery**：投影失败只保留错误和 stale/fatal 派生物；canonical facts 原样保留，回滚只恢复 P2 diagnostics/projector/schema/test。
- **task risk**：required fields 与实际 facts 粒度不一致会造成 unknown；这是必须显示的缺口，不可用页面猜测补齐。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：实现 diagnostics 的 unknown/unavailable 边界、固定分母与 trend/cost 去重；实现 projection schema/readiness；实现 canonical facts 删除派生物后的重建；补充 hash 不变断言。
- **executed_commands**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`；`exit=0`；29 + 16 tests passed。
- **evidence_refs**：[`quality/tests/build-code/m15-diagnostics/T009-green.json`、`quality/tests/build-code/m15-rebuild/T012-rebuild.json`]
- **covered_ac**：AC-004、AC-006、AC-007、AC-008、AC-009
- **review_fact**：Phase 2 review 见 `quality/facts/5974125e7337611b8a3e8907dcea14dc707b77b8995f3572e90b547f56cf5d8d.json`，status=`unavailable`；没有把 unavailable 写成 pass。
- **completed_at**：`2026-08-13T16:16:42+08:00`
- **执行事实**：GREEN 保持 missing、unknown、unavailable、partial、stale、fatal 的差别；automation 无分母时不算比例，trend 不把单 bucket 当趋势，cost 只使用稳定身份；删除隔离派生物后从 `facts.jsonl` 重建，canonical facts 字节和 SHA-256 均由测试断言未变。

#### T010 — RED：HTML 必须消费四区和完整状态 contract

- **ID**：T010
- **Phase**：Phase 2 — projection、诊断与四区页面
- **goal**：重现旧页面固定五阶段、筛选不足、duration 写死“未拆分”、状态/coverage 缺失、证据回链不完整和 `innerHTML` 风险。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004、R-007、R-008、D-001、D-002、D-004、M15-BASELINE、PFACT-005、PFACT-007
- **输入**：T009 projection contract、含四区/七筛选/六 UI 状态/成本拆分/controlled evidence ref 的 data.js snapshot，以及 partial/stale/fatal/empty_valid 输入。
- **依赖**：T009
- **并行**：否
- **FR**：FR-VIEW-001 FR-VIEW-002 FR-COST-001 FR-E2E-001；历史 alias `FR-VIEW-003 → FR-VIEW-002`、`FR-COST-003 → FR-COST-001` 仅为当前 spec 的机械覆盖，不是活动 FR。
- **AC**：AC-005 AC-006 AC-008 AC-010
- **动作**：先增加页面 contract 和 static safety assertions，逐项检查四区、七类筛选、默认/刷新行为、task 下钻、状态映射、sample sufficiency、真实 duration split、evidence ref 和 DOM 文本安全；同时固定 build-code `isolated-browser-qa` 的 route、snapshot、六状态输入、筛选交互和 evidence path。
- **精确文件**：`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html`、`tests/m15-monitoring-projector.test.mjs`
- **boundary**：files: `runtime/evidence/monitoring-projector.mjs`; `runtime/evidence/monitoring-page.html`; `tests/m15-monitoring-projector.test.mjs`
- **输出**：一条能失败的 page contract RED，明确指出 UI 结构或安全边界遗漏。
- **Knowledge**：浏览器验收不等于字符串检查；本卡只固定可自动断言的 contract，交互由 build-code 的 isolated browser QA 证明。
- **test tier**：fullstack-slice
- **test method**：自动部分用 `fullstack-slice-testing`；浏览器部分由 `isolated-browser-qa` 在 build-code 读取同一 snapshot，使用 isolated profile、native refresh 和清理证据。
- **scenarios**：SCN-003 loading/ready/empty_valid/partial/stale/fatal；SCN-005 cost/trend；SCN-009 evidence text safety；AC-005 七筛选/四区/下钻；AC-010 fresh page readback。
- **fixtures_services**：T009 projection/data.js；fresh task id；controlled evidence refs；六 UI 状态 snapshots；isolated browser session/profile；不复用历史登录态，不读取 raw transcript。
- **coverage limits**：T010 RED gate 只证明自动 page contract；真实点击、刷新、清理和截图必须另存 browser evidence，不能由 Vitest exit 代替。
- **verification_role**：RED
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`
- **expected_exit**：1
- **oracle**：M15_PAGE_CONTRACT — 四区、七筛选、状态映射、成本拆分、证据回链和文本安全是否完整
- **evidence_path**：`quality/tests/build-code/m15-page/T010-red.json`; browser handoff: `quality/tests/build-code/m15-browser/T010-scenarios.json`
- **STOP**：若页面通过读取本机路径、内嵌 raw transcript 或 `innerHTML` 注入来源文本，停止并改为受控 opaque ref + textContent。
- **recovery**：保留 RED 页面 snapshot 和 assertion；不修改外部生成页面文件和历史 HTML。
- **task risk**：静态页面容易在 fixture 下看似完整；oracle 必须绑定 projection/data.js snapshot 和 task id。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：页面 RED 与 diagnostics/projector RED 在同一 focused run 中捕获；没有为了补齐卡片而回滚当前实现或伪造第二次 RED。
- **executed_commands**：与 T008 共用 `npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`；`exit=1`；页面相关失败已列在 T008 RED receipt。
- **evidence_refs**：[`quality/tests/build-code/m15-diagnostics/T008-red-current.json`]
- **covered_ac**：AC-005、AC-006、AC-008、AC-010（页面相关 RED 缺口）
- **review_fact**：Phase 2 review 见 `quality/facts/5974125e7337611b8a3e8907dcea14dc707b77b8995f3572e90b547f56cf5d8d.json`，status=`unavailable`。
- **completed_at**：`2026-08-13T16:16:42+08:00`
- **执行事实**：原始 RED 已明确显示 view/readiness contract 缺失和 `innerHTML` 风险；因为它与 T008 共用一次真实 RED，不创建不存在的 `quality/tests/build-code/m15-page/T010-red.json`。

#### T011 — GREEN：HTML 四区、筛选和安全回链可用

- **ID**：T011
- **Phase**：Phase 2 — projection、诊断与四区页面
- **goal**：实现四区 static HTML、七类共享筛选、任务下钻、六 UI 状态、真实可得的 cost split、sample sufficiency、controlled evidence ref 和文本安全。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：R-004、R-007、R-008、D-001、D-002、D-004、M15-BASELINE、PFACT-005、PFACT-007
- **输入**：T010 RED、T009 projection schema、fresh/partial/stale/fatal/empty_valid snapshots、controlled refs 和 browser route fixture。
- **依赖**：T010
- **并行**：否
- **FR**：FR-VIEW-001 FR-VIEW-002 FR-COST-001 FR-E2E-001；历史 alias `FR-VIEW-003 → FR-VIEW-002`、`FR-COST-003 → FR-COST-001` 仅为当前 spec 的机械覆盖，不是活动 FR。
- **AC**：AC-005 AC-006 AC-008 AC-010
- **动作**：页面只从一份 `workflowhub-monitor-data.js` snapshot 读取；实现四区和共享筛选，task row 下钻，状态/coverage/errors/sample 显示，duration 只按有 stable identity 的 facts 拆分；证据通过 textContent 展示 opaque ref。
- **精确文件**：`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html`、`tests/m15-monitoring-projector.test.mjs`
- **boundary**：files: `runtime/evidence/monitoring-projector.mjs`; `runtime/evidence/monitoring-page.html`; `tests/m15-monitoring-projector.test.mjs`
- **输出**：同命令 GREEN；自动 contract 通过，并为 build-code browser QA 提供 fresh snapshot、路由和证据入口。
- **Knowledge**：打开读取一次；刷新使用浏览器原生行为回默认筛选；页面不自行生成 failure domain、friction_type、error_code 或 cost 数字。
- **test tier**：fullstack-slice
- **test method**：自动部分用 `fullstack-slice-testing`；随后由 `isolated-browser-qa` 在同一 fresh snapshot 执行四区、七筛选、下钻、刷新、六状态和 evidence panel，并保存清理事实。
- **scenarios**：SCN-003 default task overview；SCN-004 degradation drilldown；SCN-005 cost/trend；SCN-006 partial/stale/fatal；SCN-009 opaque ref/textContent；SCN-010 fresh HTML readback。
- **fixtures_services**：T010 RED；T009 projection contract；fresh public-run snapshot；browser isolated profile/session；controlled six-state data.js variants；任务结束清理 browser/temp storage。
- **coverage limits**：GREEN 自动 contract 不等于 browser pass；若 fresh host source unavailable，页面必须显示真实 partial/unknown，不能补 transcript/cost。
- **verification_role**：GREEN
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_PAGE_CONTRACT — 四区、七筛选、状态映射、成本拆分、证据回链和文本安全是否完整
- **evidence_path**：`quality/tests/build-code/m15-page/T011-green.json`; browser evidence: `quality/tests/build-code/m15-browser/T011-browser.json`
- **STOP**：若真实 facts 没有 duration/token identity，页面必须显示 insufficient/unavailable，不能硬算拆分或显示零。
- **recovery**：页面回滚不触碰 canonical facts；删除隔离派生物后由 T009 的 projector 重建。
- **task risk**：UI 可能把 partial 解释成 workflow failed；oracle 要检查页面标签与 projection status 的双层映射。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：页面实现四区、共享筛选、状态/readiness、真实 duration breakdown、任务下钻和受控 evidence ref；移除 `innerHTML`，统一用安全 DOM 文本写入。
- **executed_commands**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`；`exit=0`；45 tests passed；随后用 `isolated-browser-qa`/`agent-browser` 在 fresh snapshot 完成四区、筛选、下钻、原生刷新、证据文本和清理。
- **evidence_refs**：[`quality/tests/build-code/m15-page/T011-green.json`、`quality/tests/build-code/m15-browser/T011-browser.json`]
- **covered_ac**：AC-005、AC-006、AC-008、AC-010
- **review_fact**：Phase 2 review 见 `quality/facts/5974125e7337611b8a3e8907dcea14dc707b77b8995f3572e90b547f56cf5d8d.json`，status=`unavailable`；浏览器 QA 是行为证据，不是 review pass。
- **completed_at**：`2026-08-13T16:16:42+08:00`
- **执行事实**：浏览器使用 isolated `agent-browser`，未复用登录态、未切换引擎；页面能切换四区，七类筛选联动，刷新回默认，任务行能下钻到退化区，evidence ref 只显示受控文本；session 清理完成，临时 app server 保持运行。截图 hash 已写入 browser evidence。

#### T012 — Phase 2 aggregate evidence：非行为汇总

- **ID**：T012
- **Phase**：Phase 2 — projection、诊断与四区页面
- **goal**：汇总 P2 focused tests、facts-preserving rebuild、page contract、sample sufficiency 和浏览器 QA handoff 所需输入。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-runtime-observability-repair/spec.md","hash":"fdf147d32bf4ffd56302136c96132817db14ddd54deada8ef426a09d947c7af6","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/m15-runtime-observability-repair/plan.md","hash":"2a3abe719fcd19cc61d9ee1641932f0e8e8293a6fff1a43adf07e501abb1c3dd","id":"PLAN"}]`
- **source_refs / decision_refs**：D-001、D-002、D-004、FR-VIEW-001、FR-PROJ-001、FR-HANDOFF-001、AC-005、AC-009、AC-011
- **输入**：T008～T011 执行 facts、projection/data/page refs、facts hash 前后比较、隔离删除/重建记录和 browser QA 输入清单。
- **依赖**：T011
- **并行**：否
- **FR**：FR-VIEW-001 FR-VIEW-002 FR-DIAG-001 FR-COST-001 FR-PROJ-001 FR-HANDOFF-001
- **AC**：AC-005 AC-006 AC-007 AC-008 AC-009 AC-011
- **动作**：按 fresh public run → facts/evidence → project/global projection → data.js/HTML → isolated browser → 删除派生物 → 重建的顺序汇总真实命令 exit、projection/page refs、facts hash、sample status、浏览器 QA artifact 和延期；删除范围只允许是隔离 storage 中的 project/task projection、global jsonl、data.js 和 HTML，历史 task 与 canonical facts 必须由目录/hash sentinel 证明未变。
- **精确文件**：`runtime/evidence/monitoring-diagnostics.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/schemas/monitoring-projection.v1.json`、`runtime/evidence/monitoring-page.html`、`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-monitoring-projector.test.mjs`
- **boundary**：files: `runtime/evidence/monitoring-diagnostics.mjs`; `runtime/evidence/monitoring-projector.mjs`; `runtime/schemas/monitoring-projection.v1.json`; `runtime/evidence/monitoring-page.html`; `tests/m15-monitoring-diagnostics.test.mjs`; `tests/m15-monitoring-projector.test.mjs`
- **输出**：P2 aggregate evidence index，明确已证明的页面/投影行为、browser QA handoff、unknown/incomplete 和未来 M16 可消费的事实边界。
- **Knowledge**：aggregate 是 execution fact，不是第五份材料、不是 close、不是 review pass。
- **test tier**：aggregate
- **test method**：focused Vitest aggregate + `isolated-browser-qa` handoff evidence reconciliation；不在 build-plan 执行浏览器。
- **scenarios**：P1 T001～T007；P2 T008～T011；fresh public entry；M10/M14b caller trace；derived delete/rebuild；browser six-state/filter/drilldown/refresh/security/cleanup。
- **fixtures_services**：T001～T011 evidence refs；fresh storage and history sentinel；exact derived deletion list；browser artifact directory `quality/tests/build-code/m15-browser/`；host capability matrix。
- **coverage limits**：只证明 build-code 下一步有完整执行包；不能把 aggregate、Vitest 或 static HTML check 宣称为 verify-code/browser 完成，也不产生 M16 candidate data。
- **verification_role**：N/A — non-behavior aggregate records existing P2 evidence
- **paired_task**：N/A — aggregate verification has no behavior pair
- **gate_cmd**：`npx vitest run tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：M15_P2_AGGREGATE — P2 evidence refs、FR/AC 覆盖、rebuild hash 和 browser handoff 可追溯
- **evidence_path**：`quality/tests/build-code/m15-p2-aggregate.json`; browser/rebuild inputs: `quality/tests/build-code/m15-browser/`、`quality/tests/build-code/m15-rebuild/`
- **STOP**：若 aggregate 需要修改历史 projection、伪造 browser result 或把 advisory review 写成 pass，停止并保留真实缺口。
- **recovery**：重新汇总 P2 evidence；不改 canonical facts，不创建新 writer。
- **task risk**：页面 contract 绿不代表浏览器交互绿；必须把 browser QA 保留为独立的 verify evidence。

##### 执行状态填写区（唯一完成权威）

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：汇总 P2 focused evidence、重建保护、浏览器 QA 和最终聚合测试；未新增 writer、未修改历史 facts。
- **executed_commands**：P2 focused command `exit=0`（45 tests）；最终 aggregate `npx vitest run tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs --passWithNoTests=false`，`exit=0`（98 tests）。
- **evidence_refs**：[`quality/tests/build-code/m15-p2-aggregate.json`、`quality/tests/build-code/m15-final-aggregate.json`、`quality/tests/build-code/m15-rebuild/T012-rebuild.json`、`quality/tests/build-code/m15-browser/T011-browser.json`]
- **covered_ac**：AC-005、AC-006、AC-007、AC-008、AC-009、AC-011；并引用 P1 T001～T007 evidence。
- **review_fact**：Phase 2 review 见 `quality/facts/5974125e7337611b8a3e8907dcea14dc707b77b8995f3572e90b547f56cf5d8d.json`，status=`unavailable`；aggregate 不把 advisory/unavailable review 写成 pass。
- **completed_at**：`2026-08-13T16:16:42+08:00`
- **执行事实**：最终 98 个测试通过；四区页面与投影共用一份 snapshot；unknown/partial/宿主 source unavailable 仍可见；重建只消费 canonical facts；历史数据未处理；M16 candidate data 未生成。下一步仅做 stage-end spec-analyze 和 verify-code 独立回放。
- **执行事实**：早先 integration review attempt `quality/reviews/attempts/eb02a062-605f-4690-af2e-4c3e206aff68/attempt.json` 和本次 attempt `quality/reviews/attempts/18cdbfc2-3d99-441e-895b-55dd9ce3c5b4/attempt.json` 都因 T008 旧证据非法尾部而 `unavailable`；不把 unavailable 写成 pass。两份坏记录保留，当前引用已切到 `quality/tests/build-code/m15-diagnostics/T008-red-current.json`；待当前快照集成复核重新执行。stage-end spec-analyze 已执行：返回 `consistent`，8/9 条原始需求有语义证据，R-009 延期给 M16。
- **执行事实**：verify-code 风险回放已在当前源快照执行，40 tests、`exit=0`；浏览器 QA 已完成并保留同任务材料边界，AC-001/AC-010 仍为 unknown/incomplete。
- **执行事实**：verify-code 异源复核只发起一次；attempt `quality/reviews/attempts/b8c471e0-9899-480b-8f5c-b9d99f7ca2f7/attempt.json` 返回 `unavailable`，`error_code=OUTPUT_INVALID`，没有可采纳的异源 finding；按规则不重审、不追 provider pass，不因此改代码。当前 verify 质量事实保持 `incomplete`。

## Phase 3 — 正常会话自动 outcome 与正式验收

### Goal

把正常 WorkflowHub 会话自动产生的执行结果、official run、canonical facts、投影、页面和 formal acceptance 串成同一条可回读链；Codex host 能力未证明时保留真实 incomplete/unavailable，不把测试或历史记录写成生产完成。用户不手工启动第二个 Stage Agent。

### Files

- **MODIFY**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-protocol.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **MODIFY**：`specs/m15-runtime-observability-repair/tasks.md`
- **READ ONLY**：`tools/cli/stage-runtime.mjs`、`runtime/evidence/monitoring-projector.mjs`、`runtime/evidence/monitoring-page.html`
- **EVIDENCE ONLY**：`quality/evidence/stage-outcomes/build-code/cf48b572236eae101b3b72955851badb39f7f2cece67568ab174410ace2fa658.json`、`quality/verify-code/`、`quality/tests/build-code/`、`specs/m15-runtime-observability-repair/tasks.md`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **READ ONLY**：`runtime/stage/stage-runner.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`

### Tasks

- T013：验证 adapter 只接受真实执行结果，并经现有 `TaskKernel` 认证、绑定和写入。
- T014：把 outcome 接入正常 WorkflowHub 会话的私有生命周期；没有自动会话调用就保留 `incomplete/unavailable`。
- T015：基于同一 outcome 回读 public run、facts、projection、HTML、浏览器和历史只读边界。
- T016：汇总命令、exit、oracle、证据和未闭合边界；不把 aggregate 当作质量通过。

### Verify

T013 使用 adapter contract 测试；T014 必须有正常 WorkflowHub 会话自动调用产生的非 fixture current outcome/source；T015/T016 只能引用同一 task 的当前 outcome、facts、页面和重建证据。

### Knowledge

正常 WorkflowHub 会话及其 Codex host 负责产生真实执行边界和 source，WorkflowHub 只认证并保存 outcome；`facts.jsonl` 是唯一事实源，projection/data/page 可删除重建。

### STOP

若只能手工构造 outcome、要求用户启动 Stage Agent、扫描 session、猜 task/path、使用 fixture 冒充生产，或任一链路无法回读同一 task，保持 incomplete，不继续伪造闭环。

### Done

只有正常会话自动产生的 current outcome、official run、facts、projection、HTML 和真实浏览器/重建证据能相互回指时，才记录基础链已证明；Codex 细节不能采集时继续显示 unavailable/unsupported/unknown，但不能把 step/skill 硬要求写成完成。

### Risks and rollback

只回滚当前 adapter/test 或隔离派生物；不删除历史 facts、不回填历史任务、不改 M16。

### T013 — adapter contract

- **ID**：T013
- **Phase**：Phase 3 — 正常会话自动 outcome 与正式验收
- **goal**：定义并验证 `runtime/stage/stage-agent-outcome-adapter.mjs` 的会话接入边界；只接收当前会话已产生的执行结果，经现有 `TaskKernel` 认证、绑定和写入。
- **design_state**：pending
- **versioned_refs**：`specs/m15-runtime-observability-repair/spec.md`、`specs/m15-runtime-observability-repair/plan.md`
- **source_refs / decision_refs**：D-005、D-006、D-007、AC-001、AC-010
- **输入**：当前 task、current snapshot、materials、stage manifest、正常会话执行结果。
- **依赖**：T012
- **并行**：否
- **FR**：FR-CHAIN-001、FR-CHAIN-002、FR-E2E-001
- **AC**：AC-001、AC-002、AC-010
- **动作**：实现后验证错误 task/stage/attempt、stale snapshot、缺逐步结果、fixture 标记、session 扫描和第二 writer 均被拒绝；成功路径只调用现有 `TaskKernel`。
- **精确文件**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：只新增/修改上述 adapter contract 文件；不改 public stage 语义，不新增 `record-*`。
- **输出**：adapter contract evidence。
- **Knowledge**：WorkflowHub runtime 不启动 Agent；adapter 不证明用户意图，只认证当前会话提交且绑定正确的执行结果。
- **verification_role**：N/A — non-behavior contract boundary is planned here; execution evidence belongs to build-code
- **paired_task**：N/A — contract evidence is not a RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：`M15_ADAPTER_CONTRACT`：绑定严格、唯一 writer、非法输入明确失败。
- **evidence_path**：`quality/tests/build-code/m15-adapter/T013-contract.json`
- **STOP**：若需要 fixture、session 目录扫描、路径猜测或第二 writer，停止并保持 incomplete。
- **recovery**：保留失败事实，回滚仅限 adapter/test contract 文件。
- **task risk**：contract 通过不等于正常会话已经自动调用。

#### 执行状态填写区

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：完成宿主结果 adapter；验证它只接受已执行 outcome，并通过现有 TaskKernel 写入，拒绝错误 task/stage/attempt、stale snapshot、缺步骤结果、fixture 标记、session 扫描和第二 writer。
- **executed_commands**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs --passWithNoTests=false`，`exit=0`；随后纳入最终 7 文件端到端定向测试，`146 passed`。
- **evidence_refs**：[`quality/tests/build-code/m15-adapter/T013-contract.json`]
- **covered_ac**：AC-001、AC-002、AC-010 的 adapter contract 部分；不覆盖真实宿主已调用。
- **review_fact**：contract 测试通过；这不是外部宿主执行证明。
- **completed_at**：`2026-08-14T00:00:00+08:00`
- **执行事实**：adapter contract 已有当前测试事实；真实宿主调用仍由 T014 单独负责，不能把 contract 通过写成生产闭环通过。

### T014 — 正常会话自动产出 current stage outcome

- **ID**：T014
- **Phase**：Phase 3 — 正常会话自动 outcome 与正式验收
- **goal**：由用户正常使用的 WorkflowHub 当前会话执行 current stage，自动调用私有接线并产出可供 public `run` 消费的 current stage outcome；用户不另开 Stage Agent。
- **design_state**：incomplete
- **versioned_refs**：`specs/m15-runtime-observability-repair/spec.md`、`specs/m15-runtime-observability-repair/plan.md`
- **source_refs / decision_refs**：D-001、D-002、D-003、AC-001、AC-010
- **输入**：当前宿主执行、current snapshot/materials/manifest/spec-analyze 绑定。
- **依赖**：T013
- **并行**：否
- **FR**：FR-CHAIN-001、FR-E2E-001
- **AC**：AC-001、AC-010
- **动作**：正常 WorkflowHub 会话由项目级 hook 自动登记精确 transcript；工作流在每个 manifest step/skill 边界调用私有事件命令，记录开始、结束、结果、证据和可读到的 token usage；public `run` 根据明确的 project/task/stage context 自动调用 bridge/adapter，再消费同一份 outcome。旧 outcome 只读保留，不作为当前闭环证据；不得调用、修改、构建、测试或同步外部项目。
- **精确文件**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tools/host/workflowhub-stage-agent-protocol.mjs`、`.codex/hooks.json`、`tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、五个 workflow `SKILL.md`、`tests/m15-codex-session-hook.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：只消费当前正常会话真实 outcome；用户手工启动、测试 helper、模板和旧记录不得作为生产证据。
- **输出**：当前会话自动产生的 outcome ref、source ref、public run 回读事实和质量状态。
- **Knowledge**：CLI exit 0 只代表命令执行成功，不代表 outcome 质量完成；没有自动 caller 时必须明确 incomplete。
- **verification_role**：N/A — non-behavior host handoff records an external execution dependency
- **paired_task**：N/A — host handoff is an external dependency, not a RED/GREEN pair
- **gate_cmd**：`node tools/cli/stage-runtime.mjs run --input=/path/to/real-host-run-input.json`
- **expected_exit**：0
- **oracle**：`M15_REAL_HOST_OUTCOME`：同一 task/run/attempt/stage 可回读；outcome 当前、非 fixture；质量状态诚实。
- **evidence_path**：`quality/evidence/stage-outcomes/build-code/cf48b572236eae101b3b72955851badb39f7f2cece67568ab174410ace2fa658.json`
- **STOP**：没有正常会话自动调用时，不用 fixture 或手工 Stage Agent 冒充；本卡保持 `incomplete/unavailable`。
- **recovery**：保留现有 outcome 和 incomplete 事实；不重写、不替换、不补历史。
- **task risk**：CLI 成功可能掩盖质量不完整，必须分开记录。

#### 执行状态填写区

- **任务完成**：[x]
- **status**：`incomplete`
- **actual_changes**：真实 issue `DEV-4` 通过 Multica host 运行完成；bridge 写入 current `workflowhub-stage-outcomes.v1`，official `run` 成功消费并生成 facts/projection/page。outcome 质量如实为 `incomplete`：15 个步骤未在本次 delivery reconciliation 重跑，`spec-analyze` 已实际执行但 validator 返回 `material_incomplete`；Codex transcript source 仍为 `missing`，未伪造为成功。
- **executed_commands**：真实宿主 issue `07ac204c-98f6-4396-80db-9e1a98f5a942` 的 run `e2348e52-f575-4833-8f8f-6912ca3e8301`，Multica run `completed`；official stage receipt `quality/evidence/stage-outcomes/build-code/cf48b572236eae101b3b72955851badb39f7f2cece67568ab174410ace2fa658.json`；receipt `status=incomplete`、`spec-analyze trigger=true/executed=true`。
- **evidence_refs**：[`quality/evidence/stage-outcomes/build-code/cf48b572236eae101b3b72955851badb39f7f2cece67568ab174410ace2fa658.json`、`quality/evidence/stage-outcome-proofs/78610a387862672a3fe7474969474efc819577c1dfe807158a5eddd8292ef5a9.json`、真实宿主 issue `07ac204c-98f6-4396-80db-9e1a98f5a942`、run `e2348e52-f575-4833-8f8f-6912ca3e8301`]
- **covered_ac**：AC-001、AC-010 的真实 host producer 与 official delivery 已证明；质量内容和 source 能力仍保持 incomplete/missing。
- **review_fact**：未产生新的 review pass。
- **completed_at**：`2026-08-14T12:27:16+08:00`。
- **执行事实**：真实 host producer、bridge、official run 和 current receipt 已闭合；闭合的是“交付链能正确记录真实不完整结果”，不是“本次 build-code 质量已完成”。
- **执行事实（2026-08-15 real-v3）**：本次 Codex Stage Agent 读取当前四份材料和实现，按实际 diff 重判 `fullstack`，执行当前 M15 aggregate，`exit=0`，7 files / 156 tests passed；`git diff --check` 为 0。当前 review attempt 返回 `snapshot_or_material_identity_unavailable`，spec-analyze validator 返回 `material_incomplete`；本次没有 authenticated current TaskHandle、真实 host outcome 或当前 browser artifact，所以 T014 仍为 `incomplete`。非空执行包已写入并校验：`/tmp/workflowhub-m15-build-code-execution-20260815-real-v3.json`。
- **执行事实（2026-08-18 current-session repair）**：新增当前 WorkflowHub 会话生命周期记录器和私有 bridge session 入口；同一会话的 step/skill 开始、结束、证据、source/session 绑定和真实 usage 会进入现有 adapter/TaskKernel。成本允许“时间已记录、token 未提供”的 `partial`，facts 分别显示 duration 与 token，未提供的字段保持 `unavailable`，不补零、不平均。当前 focused integration、M15 cost slice、cost fail-loud slice、plan/task contract 和结构检查均通过；这些是代码链证明，不是当前 Codex host 已自动调用的证明。
- **执行事实（2026-08-18 host capability）**：当前会话环境只发现 `CODEX_THREAD_ID`，没有 host 注入的 rollout/source/outcome 生命周期入口；因此 T014 仍保持 `incomplete`，不能把本次测试 bridge 当成真实当前会话证明。下一步只需由 WorkflowHub 当前会话 host 自动调用该 private session bridge，再做一次 fresh official run → facts → projection → page 回读。
- **执行事实（2026-08-18 hook probe 修正）**：当前 Codex 全局 hook 只有 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PreCompact`、`Stop`；当前 WorkflowHub 仓库没有项目级 `.codex/hooks.json`，所以正常会话还没有接入 WorkflowHub。Codex hook 能给出精确的 `session_id`、`transcript_path`、`cwd` 和工具调用，但没有 WorkflowHub 的 stage/step/skill 语义事件；因此下一步应接入项目级 source handoff，再由同一 WorkflowHub 会话的工作流边界发出 step/skill 事件。不能靠猜测、平均分配或手工启动另一个 Agent 补齐；T014 继续保持 `incomplete`。
- **执行事实（2026-08-18 same-session auto-binding repair）**：新增项目级 `.codex/hooks.json`、临时 Codex session handoff、同一会话 step/skill event marker；`stage-runtime run` 在没有显式 stage outcome 时会从当前 workspace 的精确 handoff 自动调用现有 bridge/adapter，再由 official run 消费 outcome。step/skill 的开始/结束、证据、耗时和 transcript 中可读到的 `last_token_usage` 会进入同一 outcome；读不到 token 仍保持 partial/unavailable；同一 workspace 多会话直接 conflict，不猜来源。`npx vitest run tests/m15-codex-session-hook.test.mjs tests/integration/vnext-official-stage-run.test.mjs -t 'public run automatically consume|same private commands|registers the exact hook|project hook payload|two sessions' --passWithNoTests=false` 为 `5 passed`；`npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/stage-interaction-contract.test.mjs --passWithNoTests=false` 为 `35 passed`；`node tools/cli/verify-structure.mjs` 与 `git diff --check` 通过。上述是当前代码和接线合同证据，不是本次 Codex 对话已经重新加载项目 hook 的 fresh host 证据；T014 仍保持 `incomplete`，待 fresh trusted session 真实回读。
- **执行事实（2026-08-18 command-shape repair）**：工作流文档使用的 `--name=value` 写法已与私有事件命令对齐；命令同时兼容空格分隔写法，step/skill 事件和证据参数都不再因参数格式被静默漏记。新增测试覆盖 equals 形式，`tests/m15-codex-session-hook.test.mjs` 与 `tests/stage-interaction-contract.test.mjs` 共 `18 passed`；结构检查和 `git diff --check` 仍通过。该修复不改变 facts writer、历史数据或外部项目范围。
- **执行事实（2026-08-18 cost-total repair）**：step/skill 成本是嵌套范围；当 transcript 总量存在时，总量继续只取 transcript，step/skill 只进入各自拆分；当 transcript 总量不可用时，总量按每个 stage 选择最粗且可用的 stage→step→skill 范围，避免同一段时间/token 被父 step 和子 skill 重复计入，同时保留各行下钻成本。`tests/m15-monitoring-diagnostics.test.mjs`、`tests/m15-codex-session-hook.test.mjs`、`tests/stage-interaction-contract.test.mjs` 共 `58 passed`。
- **执行事实（2026-08-18 page-layout repair）**：静态页的证据面板已改为固定右侧抽屉，正文右栏独立滚动，左侧任务列表固定；抽屉支持关闭和 Escape，仍用 `textContent` 展示受控引用。用隔离 `agent-browser` 检查了真实数据快照：页面正常加载、证据点击打开抽屉、关闭成功、`position=fixed`、右栏 `overflow-y=auto`、console messages 为 0；截图保存为 `/tmp/workflowhub-monitor-drawer-open-qa.png` 和 `/tmp/workflowhub-monitor-drawer-qa.png`，QA 已清理，临时服务已停止。页面外部生成物未改写。
- **执行事实（2026-08-18 current-session probe）**：当前会话读取 `readCurrentCodexSession({cwd})` 仍为 `unregistered`；说明本会话尚未加载项目级 Hook，不能把本会话冒充 fresh trusted host。当前外部生成页时间为 `18:23`，页面源为 `18:50`，因此旧页面仍不会自动出现本轮布局；按“历史不回填”边界，等待下一次真实 fresh `run` 由 projector 正常生成，不直接改写外部生成物。
- **执行事实（2026-08-18 final page smoke）**：媒体查询修正后再次用隔离 `agent-browser` 检查：`main.overflowY=auto`、证据抽屉 `position=fixed`，打开时 transform 回到可见位置，关闭成功，console messages 为 0；浏览器会话、临时服务和临时目录均已清理。仍只验证仓库页面源配合现有快照，未把它写成 fresh host 验收。
- **执行事实（2026-08-18 Codex hook trust boundary）**：已对照 Codex 官方 hooks 说明确认，`<repo>/.codex/hooks.json` 是支持的项目级入口，但非托管 command hook 在首次加载或内容变化后必须由用户在 Codex `/hooks` 中审查并信任；当前 `/Users/Hugh/.codex/config.toml` 只有全局 hook 的 trust hash，没有本项目新 hook 的 hash。因此当前会话没有自动登记并非代码已成功接线，而是本会话尚未完成一次性 hook trust；不能通过手写全局 hash、猜 transcript 路径或手工写入 session 状态绕过这个安全边界。项目代码和测试保持不变，T014 继续为 `incomplete`，待用户信任项目 hook 后在新鲜正常会话中真实回读。
- **执行事实（2026-08-18 transcript 缺失边界修正）**：Codex hook 的 `transcript_path` 允许为空时，当前会话现在仍会登记并继续记录 step/skill 的真实耗时；token 保持未提供，监控 source 保持不可用，不补零、不猜路径。`tests/m15-codex-session-hook.test.mjs` 定向结果为 `5 passed`，并通过 `node --check` 与 `git diff --check`。有 transcript 的正常路径仍使用原精确文件和 token 统计。
- **执行事实（2026-08-18 transcript 路径保留修正）**：同一会话后续 hook 缺少 transcript 时不会覆盖启动时已登记的精确路径；后续重新提供路径也能恢复 token 统计。定向 hook 测试现为 `6 passed`，结构验收通过，未运行全量测试。
- **执行事实（2026-08-18 projector compatibility repair）**：发现当前 WorkflowHub task 的历史 `facts.jsonl` 从第 `8284` 行起存在旧 monitoring value 字段（例如 `execution_id`、生命周期时间字段），严格读取会让整个 task 回退到旧 stale projection。projector 现在只在只读投影边界兼容这类旧行：保留合法 monitoring rows，把坏行写入 projection error；非法 JSON、身份错、quality facts 混入等仍 fail-loud。真实 task 的临时副本回读结果：`status=partial`、`stale=false`、`facts=18713`、manifest topology 下 `63` 个 step / `30` 个 skill 可见，覆盖分别为 `6/63`、`4/30`；step 成本仍为空，skill 成本只覆盖已有合法历史记录。原始 `facts.jsonl` 未修改，其他项目未读取写回。
- **执行事实（2026-08-18 projector fail-closed tightening）**：只读兼容层不会吞掉损坏的普通 task fact；合法旧 task fact继续跳过，字段或摘要损坏仍使该 task 保留旧 stale projection。M15 projector 与 Codex hook 定向测试共 `28 passed`，未运行全量测试。
- **执行事实（2026-08-18 task identity isolation）**：发现当前 Codex 会话已有其他任务的 step/skill 事件；原实现只按 workspace/stage 读取，存在串入 M15 的风险。现在私有事件、spec-analyze 和 public 自动绑定都要求并校验当前 task id，读取只保留同 task 事件；当前真实会话回读为 `session_id=01a01210-9fd4-7bd1-8e97-2f27aa346e50`，M15 task `m15-runtime-observability-repair` 的匹配事件数为 `0`，未把其他任务写进 M15。`tests/m15-codex-session-hook.test.mjs` 为 `7 passed`；官方同会话自动接入用例通过。完整 integration 文件另有既有 review 状态期望失败（`missing` vs `unavailable`），与本修复无关，未扩大范围处理；T014 继续保持 `incomplete`，等待真实 M15 当前阶段事件和 fresh official run。
- **执行事实（2026-08-18 current review-config doctor）**：`node skills/wh-review/scripts/wh-review-cli.mjs doctor` 退出 `0`，当前 trusted 3rd-review 配置可读且五个正式 stage 都可解析，证据见 `quality/tests/verify-code/m15-wh-review-doctor-current-20260818.json`。这不等于 provider 已完成本次 M15 审查；最近一次当前快照 review 仍是 `unavailable / snapshot_or_material_identity_unavailable`，不改写为 pass，也不重复调用。
- **执行事实（2026-08-18 exact-session fail-closed repair）**：发现传入不存在的 `session_id` 时，旧 locator 逻辑会退回当前工作目录的另一个会话，存在跨任务串数据风险。现在未知或失效 locator 返回 `unregistered`，只有注册新会话时才允许在当前目录建立 handoff；SessionEnd 会移除 locator。新增回归覆盖未知精确 id、跨目录复用、SessionEnd 失效和私有 CLI，`npx vitest run tests/m15-codex-session-hook.test.mjs --passWithNoTests=false` 为 `15 passed`；`node tools/cli/verify-structure.mjs` 和 `git diff --check` 通过。未修改历史 facts、外部项目、Multica 或页面。
- **执行事实（2026-08-18 exact-session official seam regression）**：修复后重新跑 `npx vitest run tests/integration/vnext-official-stage-run.test.mjs -t "same session across stage workspaces|public run automatically consume" --passWithNoTests=false`，匹配的 public-run 用例 `1 passed`，其余 `16 skipped`；证明修复没有破坏 official run 消费同一会话事件。该测试仍是隔离 CLI 回放，不冒充真实当前 M15 五阶段 host 证据。
- **执行事实（2026-08-18 current-thread probe）**：当前 Codex thread `019ff8ae-8f94-78a3-8ecc-ca53f041844a` 通过精确 session lookup 返回 `unregistered`；`~/.codex/config.toml` 没有该项目 `.codex/hooks.json` 的 trusted hash。当前线程没有可认证的 WorkflowHub source，不能在本线程伪造 M15 五阶段回放；M15 `quality/verify.json` 继续保持 `incomplete`。
- **执行事实（2026-08-18 cost-window and stage-boundary repair）**：审计发现 step/skill token 窗口原先把结束时刻也算进去，可能在相邻生命周期边界重复计费；同时 bridge 没有再次校验事件所属 stage。现在 token 采用 `[started_at_ms, ended_at_ms)`，bridge 强制校验 `event.stage === current stage`，并补充边界回归。`tests/m15-codex-session-hook.test.mjs` 为 `16 passed`；官方 public-run 与跨阶段事件拒绝测试为 `2 passed`。未改变历史 facts、页面、Multica 或外部项目。
- **执行事实（2026-08-18 empty-task status repair）**：修正私有会话输入状态：当前 task 没有任何匹配 step/skill 事件，或没有同 task 的 `spec_analyze`，都只能返回 `status_value=incomplete`，不能误报 `completed`。当前真实 M15 回读为 `event_count=0`、`spec_analyze=null`、`status_value=incomplete`。定向 `tests/m15-codex-session-hook.test.mjs` 为 `8 passed`；`node --check`、`git diff --check` 和宪法结构检查通过。未修改历史 facts、外部项目或生成页面。
- **执行事实（2026-08-18 non-completed status repair）**：进一步收紧会话总状态：只要同 task 的任一生命周期事件不是 `completed`，即使事件已经结束，整体也保持 `incomplete`；新增失败事件回归测试。定向 hook 测试为 `9 passed`，语法、diff 和宪法结构检查通过。未修改历史 facts、外部项目或生成页面。
- **执行事实（2026-08-18 real-page QA）**：用隔离 `agent-browser` 打开本机临时静态服务的 `workflowhub-monitor.html`，选择 `m15-runtime-observability-repair` 并展开五个阶段。页面确实读到了当前 M15 数据：阶段 `5/5`，步骤 `6/63`，技能 `4/30`；未记录的步骤仍显示“未记录/未拆分”，已有技能能显示真实耗时（例如 `209306 ms`、`192 ms`），步骤成本仍未拆分。点击证据后真实打开右侧 `role=dialog` 固定抽屉，显示受控来源引用；浏览器会话、临时目录和临时服务均已清理。这个 QA 证明页面不是空白，但也直接证明当前 M15 数据还不完整；未把当前会话的其他任务事件注入 M15，未修改历史或外部项目。

## 方案 A 修正任务（2026-08-18）

> 这两张卡修复的是“同一真实 Codex source 在阶段切换时丢失”的代码边界。它们不回填已有 M15 facts，也不把当前会话（已绑定其他 task）冒充成 M15 fresh host 证据。

### T017 — RED：跨工作目录阶段切换必须复用同一 source

- **ID**：T017
- **Phase**：Phase 3 — 正常会话自动 outcome 与正式验收
- **goal**：用一个精确 session 在目录 A 登记并绑定 task，再从目录 B 读取同一 session，真实复现当前按 cwd 查找 handoff 导致的 source 丢失。
- **design_state**：ready
- **versioned_refs**：`specs/m15-runtime-observability-repair/spec.md`、`specs/m15-runtime-observability-repair/plan.md`
- **source_refs / decision_refs**：2026-08-18 方案 A 确认、PFACT-010、FR-CHAIN-003、AC-012
- **输入**：隔离 Codex session、两个工作目录、一个 task binding；不读取真实用户 session 目录。
- **依赖**：T014 当前 incomplete 事实；不要求先伪造 M15 host 完成。
- **并行**：否
- **FR**：FR-CHAIN-001、FR-CHAIN-003
- **AC**：AC-001、AC-002、AC-012
- **动作**：先增加跨 cwd 的精确 session 读取断言；断言必须要求同一 session/source/task binding 被读回，当前实现应以 `unregistered` 失败。
- **精确文件**：`tests/m15-codex-session-hook.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：只新增 RED 测试和 evidence；不改生产 handoff，不改 facts，不改页面。
- **输出**：可重复的 source handoff RED。
- **Knowledge**：当前代码把 state path 按 cwd 哈希；这正是本次 fresh M15 后四阶段 source missing 的已确认结构性风险。
- **verification_role**：RED
- **paired_task**：T018
- **test tier**：integration-slice
- **test method**：`fullstack-slice-testing` 的 host handoff slice；不启动真实 Codex，不扫描 session 目录。
- **scenarios**：SCN-011；错误 task/session 仍必须拒绝。
- **fixtures_services**：两个隔离 cwd、精确 session id、临时 transcript、现有 session handoff API。
- **coverage limits**：只锁定跨 cwd 代码断点，不证明真实 host hook 已信任，也不证明 M15 真实五阶段完成。
- **gate_cmd**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/integration/vnext-official-stage-run.test.mjs -t "same session across stage workspaces" --passWithNoTests=false`
- **expected_exit**：1
- **oracle**：`M15_SOURCE_HANDOFF_CROSS_CWD`：同一个精确 session 在第二个阶段目录仍能回读同一绑定。
- **evidence_path**：`quality/tests/build-code/m15-source-handoff/T017-red.json`
- **STOP**：若测试通过扫描 session 目录、时间排序或固定旧路径，停止并重写为精确 session id 定位。
- **recovery**：保留 RED 输出；不删除任何历史事实或旧质量记录。
- **task risk**：RED 只能证明当前代码边界，不可直接写成生产 host 已失败。

#### 执行状态填写区

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：新增跨工作目录 source handoff RED，证明当前实现从目录 A 切到目录 B 时把同一精确 session 看成 `unregistered`。
- **executed_commands**：`npx vitest run tests/m15-codex-session-hook.test.mjs -t "same session across stage workspaces" --passWithNoTests=false`，RED `exit=1`；失败断言实际状态为 `unregistered`，不是期望的 `present`。
- **evidence_refs**：[`quality/tests/build-code/m15-source-handoff/T017-red.json`]
- **covered_ac**：AC-001、AC-002、AC-012 的跨工作目录来源缺口已被真实复现；未把 RED 当成生产 host 结论。
- **review_fact**：本卡为实现前 RED；未发起额外审查，不把测试失败改写成 review 结论。
- **completed_at**：`2026-08-18T21:50:30+08:00`
- **执行事实**：断点明确为 session handoff 只按当前 cwd 读取；这与 fresh M15 后四阶段 `no_registered_source` 的结构性风险一致。历史 facts、外部项目和 Multica 未改动。

### T018 — GREEN：同一精确 source 跨五阶段复用

- **ID**：T018
- **Phase**：Phase 3 — 正常会话自动 outcome 与正式验收
- **goal**：让同一 Codex session binding 不依赖当前工作目录；五个正式阶段复用同一 source、task/run/attempt 身份，step/skill 事件和 token/duration 仍只从当前会话读取。
- **design_state**：ready
- **versioned_refs**：`specs/m15-runtime-observability-repair/spec.md`、`specs/m15-runtime-observability-repair/plan.md`
- **source_refs / decision_refs**：2026-08-18 方案 A 确认、PFACT-010、FR-CHAIN-003、AC-012
- **输入**：T017 RED、现有 session handoff、Codex `CODEX_THREAD_ID` 精确身份。
- **依赖**：T017
- **并行**：否
- **FR**：FR-CHAIN-001、FR-CHAIN-002、FR-CHAIN-003、FR-E2E-001
- **AC**：AC-001、AC-002、AC-010、AC-012
- **动作**：在现有临时 handoff 之上增加精确 session-id locator；locator 只存 handoff 位置，不复制事件。所有读取、事件写入、spec-analyze 和默认 Codex source 解析都优先使用该精确 locator；locator 缺失、task 不一致或 session 冲突时 fail-closed。
- **精确文件**：`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tests/m15-codex-session-hook.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：不新增公共命令、不新增 canonical facts writer、不扫描目录、不回填历史、不修改页面和外部项目。
- **输出**：GREEN 测试、同一 source binding 的五阶段回读证据和错误绑定负面证据。
- **Knowledge**：source binding 是整条 session 的私有 handoff；事实仍只由官方 run 写入 `facts.jsonl`。
- **verification_role**：GREEN
- **paired_task**：T017
- **test tier**：integration-slice
- **test method**：`fullstack-slice-testing`；同一命令先跑 T017 场景，再跑跨五阶段 official CLI 回放。
- **scenarios**：SCN-001、SCN-002、SCN-011；包含 source 丢失、task mismatch、session conflict。
- **fixtures_services**：两个隔离 cwd、一个精确 session locator、临时 Codex transcript、五阶段官方入口；不使用真实用户数据。
- **coverage limits**：证明代码跨 cwd handoff；真实当前 Codex hook 信任和用户新任务五阶段浏览器验收仍由 T015/verify-code 负责。
- **gate_cmd**：`npx vitest run tests/m15-codex-session-hook.test.mjs tests/integration/vnext-official-stage-run.test.mjs -t "same session across stage workspaces|public run automatically consume" --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：`M15_SOURCE_HANDOFF_CROSS_CWD`：五阶段读取同一 source/session/task binding，step/skill token/duration 可回读，错误绑定明确失败。
- **evidence_path**：`quality/tests/build-code/m15-source-handoff/T018-green.json`
- **STOP**：若 GREEN 依赖旧 facts、目录扫描、人工 task id、Stage Agent 或把缺失 token 补成 0，停止并保持 incomplete。
- **recovery**：只回滚 locator 和本卡测试；不改原始 facts、不删除旧证据。
- **task risk**：GREEN 不等于当前真实会话已加载项目 hook；T015 必须重新做真实 fresh M15 五阶段验证。

#### 执行状态填写区

- **任务完成**：[x]
- **status**：`completed`
- **actual_changes**：在现有临时 session handoff 上增加按精确 `session_id` 定位的临时 locator；所有 session 读取、绑定、step/skill 事件、spec-analyze、默认 Codex source 和 private CLI event 都能在 cwd 变化时复用同一 handoff。locator 只保存位置，不复制事件，不新增 facts writer。
- **executed_commands**：`npx vitest run tests/m15-codex-session-hook.test.mjs --passWithNoTests=false`，`13 passed`；`timeout 20s npx vitest run tests/m15-codex-session-hook.test.mjs tests/integration/vnext-official-stage-run.test.mjs -t "same session across stage workspaces|public run automatically consume" --passWithNoTests=false`，`2 passed`、`27 skipped`；`timeout 30s npx vitest run tests/m15-monitoring-integration.test.mjs scripts/__tests__/task-bootstrap.test.mjs --passWithNoTests=false`，`39 passed`；`node --check` 通过；`node tools/cli/verify-structure.mjs` 通过；`git diff --check` 通过。
- **evidence_refs**：[`quality/tests/build-code/m15-source-handoff/T018-green.json`]
- **covered_ac**：AC-001、AC-002、AC-010、AC-012 的代码合同和隔离 CLI 回放已通过；真实当前 Codex 新 M15 五阶段 host 回放、浏览器和正式 close 仍待 T015/verify-code。
- **review_fact**：本卡只完成实现和定向验证；没有把 review unavailable 或当前 CLI 绿结果写成 M15 通过。
- **completed_at**：`2026-08-18T21:56:36+08:00`
- **执行事实**：同一 session 在五个阶段和不同 cwd 下都能回读；私有 event CLI 也能通过 `CODEX_THREAD_ID` 写回原 handoff。当前真实会话仍绑定 `workflowhub-execution-flow-repair-20260818`，没有注入 M15；M15 fresh host 证据仍必须重新取得。宪法复核：locator 只按精确 session id 定位、不扫描目录、不写 canonical facts（F2/F6/F8/F9）；失败仍保持 unregistered/conflict/incomplete（Q1/Q2），没有新增公共入口或第二 writer。

### T015 — formal acceptance

- **ID**：T015
- **Phase**：Phase 3 — 正常会话自动 outcome 与正式验收
- **goal**：基于 T014 的真实 outcome，核对 public run → facts/evidence → projection → HTML → browser 及历史边界。
- **design_state**：pending
- **versioned_refs**：`specs/m15-runtime-observability-repair/spec.md`、`specs/m15-runtime-observability-repair/plan.md`
- **source_refs / decision_refs**：D-001、D-002、D-003、AC-001～AC-011
- **输入**：T013 contract evidence、T014 real-host outcome、当前 task facts/projection/page。
- **依赖**：T014
- **并行**：否
- **FR**：FR-CHAIN-001、FR-VIEW-001、FR-PROJ-001、FR-E2E-001
- **AC**：AC-001、AC-005、AC-006、AC-009、AC-010、AC-011
- **动作**：验证同一 task identity、facts hash/revision、projection 输入、HTML 数据源、浏览器状态/coverage/下钻和历史只读；advisory review 只记录事实，不改写为 pass。
- **精确文件**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：不改历史 task、不处理 M16、不把 fixture E2E 当正常会话证明。
- **输出**：formal acceptance evidence 和 AC 状态表。
- **Knowledge**：T014 未闭合时，T015 只能是 incomplete。
- **verification_role**：N/A — non-behavior acceptance record; quality remains incomplete when T014 is incomplete
- **paired_task**：N/A — acceptance is a non-behavior record, not a RED/GREEN pair
- **gate_cmd**：`npm run check && npx vitest run tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs tests/integration/vnext-official-stage-run.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：`M15_FORMAL_ACCEPTANCE`：端到端链条、页面和历史边界均有可回读证据；缺口保持 incomplete/unavailable。
- **evidence_path**：`quality/verify-code/T015-formal-acceptance.json`
- **STOP**：若真实 outcome、facts 回读、projection 输入或浏览器证据任一缺失，停止并保持 incomplete。
- **recovery**：只补当前 task 的 evidence；不改历史 facts，不重写 outcome。
- **task risk**：focused tests 绿不等于真实宿主闭环。

#### 执行状态填写区

- **任务完成**：[x]
- **status**：`incomplete`
- **actual_changes**：未修改业务实现；基于 current receipt 完成 public run → canonical facts/evidence → project/global projection → HTML/浏览器回读，并完成隔离派生物删除/重建验证；结果仍按真实缺口记为 incomplete。
- **executed_commands**：`npm run check` 退出 `0`；当前定向 7 文件测试退出 `0`（`149` passed）；当前完整 `npm test -- --run --reporter=dot` 退出 `0`（`157` 个测试文件、`1519` 个测试通过、`1` 个跳过；exclusive `31` 个测试通过）；fresh 浏览器用 `isolated-browser-qa`/`agent-browser` 完成任务选择、流程退化/成本/问题趋势切区、刷新回默认、页面截图和 console errors 检查；同一 canonical facts 在隔离 storage 删除派生物后重建，facts hash 和 snapshot/data 语义一致。
- **evidence_refs**：[`quality/evidence/stage-outcomes/build-code/f61b948add158d46e7beda373ad82e764161963dbfb81260456d297131a97225.json`、`quality/tests/build-code/m15-official-current-20260814.json`、`quality/tests/build-code/m15-browser/T011-browser.json`]
- **covered_ac**：AC-001、AC-005、AC-006、AC-009、AC-010、AC-011 的入口/页面/重建事实已回读；AC-001/AC-010 的宿主质量和 source 能力仍是 incomplete/missing，不能宣称正式完成。
- **review_fact**：异源 review 只保留 unavailable 事实，不把它改写为 pass。
- **completed_at**：`2026-08-14T12:42:18+08:00`。
- **执行事实**：T014 current outcome 已存在，浏览器已读到同一 task 的 `partial` 投影；页面明确显示 `stage.value.outcome`、`source.status`、`coverage` 的缺口。官方链和页面链已验证，但质量事实仍 incomplete，故 formal acceptance 不宣称 pass。

### T016 — Final aggregate

- **ID**：T016
- **Phase**：Phase 3 — 正常会话自动 outcome 与正式验收
- **goal**：汇总完整命令范围、exit、当前 snapshot/material hashes、真实 outcome、E2E、浏览器 QA、重建和基线全量失败边界。
- **design_state**：pending
- **versioned_refs**：`specs/m15-runtime-observability-repair/spec.md`、`specs/m15-runtime-observability-repair/plan.md`
- **source_refs / decision_refs**：D-001、D-002、D-003、AC-001～AC-011
- **输入**：T013～T015 所有执行事实和 evidence refs。
- **依赖**：T015
- **并行**：否
- **FR**：FR-CHAIN-001、FR-FACT-001、FR-VIEW-001、FR-PROJ-001、FR-E2E-001、FR-HANDOFF-001
- **AC**：AC-001～AC-011
- **动作**：汇总 `npm run check`、五个 M15 focused tests、`tests/integration/vnext-official-stage-run.test.mjs`、E2E、isolated browser QA、facts-preserving rebuild 和当前完整 `npm test -- --run` 结果；明确哪些是 M15 scope 事实，哪些是非门禁历史漂移。
- **精确文件**：`specs/m15-runtime-observability-repair/tasks.md`
- **boundary**：aggregate 不是第五份需求材料，不新增 writer，不把基线失败或 CLI exit 0 改写成 M15 pass。
- **输出**：唯一 Final aggregate evidence index 和 AC 覆盖/缺口表。
- **Knowledge**：review/test/evidence 是质量事实，不是推进许可证；incomplete/unavailable 必须保留。
- **verification_role**：N/A — non-behavior aggregate record; it cannot replace real host evidence
- **paired_task**：N/A — aggregate is a non-behavior record, not a RED/GREEN pair
- **gate_cmd**：`npm run check && npx vitest run tests/m15-codex-transcript-adapter.test.mjs tests/m15-monitoring-facts.test.mjs tests/m15-monitoring-integration.test.mjs tests/m15-monitoring-diagnostics.test.mjs tests/m15-monitoring-projector.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --passWithNoTests=false`
- **expected_exit**：0
- **oracle**：`M15_FINAL_AGGREGATE`：所有范围内事实可追溯；T014/T015 未完成时总状态为 `incomplete`。
- **evidence_path**：`quality/verify-code/T016-final-aggregate.json`
- **STOP**：若缺正常会话自动 outcome、浏览器 QA、重建证据或 AC 归属，停止并保持 incomplete。
- **recovery**：补齐缺失 evidence，不修改历史数据和四份需求材料之外的事实来源。
- **task risk**：aggregate 不能替代真实宿主调用和 formal acceptance。

#### 执行状态填写区

- **任务完成**：[x]
- **status**：`incomplete`
- **actual_changes**：汇总当前真实 host receipt、official delivery、fresh browser、isolated rebuild、当前定向/全量测试和历史只读边界；未改历史 facts、未处理 M16。
- **executed_commands**：`npm run check` 退出 `0`；M15 focused + official integration + contract E2E 退出 `0`（`149` tests）；全量 `npm test -- --run --reporter=dot` 退出 `0`，`157` 个测试文件、`1519` 个测试通过、`1` 个跳过，exclusive `31` 个测试通过；Multica `go test`/`go build` 退出 `0`；真实 host issue `DEV-4` run `e2348e52-f575-4833-8f8f-6912ca3e8301` completed，receipt quality status `incomplete`。
- **evidence_refs**：[`quality/evidence/stage-outcomes/build-code/f61b948add158d46e7beda373ad82e764161963dbfb81260456d297131a97225.json`、`quality/tests/build-code/m15-official-current-20260814.json`、`quality/tests/build-code/m15-browser/T011-browser.json`、`quality/evidence/verification/monitoring-browser-final-current-20260814b.json`]
- **covered_ac**：AC-001～AC-011 的范围事实已汇总；入口、投影、页面和重建已验证，AC-001/AC-010 仍因质量 incomplete/source missing 保持 incomplete。
- **review_fact**：非 build-code review 只作为异源建议，不作为 pass 门槛；当前 build-code 真实链结果不依赖 review pass，质量缺口按 receipt 原样保留。
- **completed_at**：`2026-08-14T12:42:18+08:00`。
- **执行事实**：T014 current outcome、official delivery、fresh browser 和派生重建都已有证据；但 receipt 的执行质量是 `incomplete`，source status 是 `missing`，因此 AC-001/AC-010 和 formal acceptance 不得改写为 pass。
- **执行事实（2026-08-15 real-v3）**：本次重新执行当前规定的 `npm run check` 与 M15 focused/official/contract aggregate，`exit=0`，156 tests passed；结果只证明当前代码和合同测试，不替代真实 host outcome、当前 browser artifact、facts-preserving rebuild 或 terminal review。T015 继续保持 `incomplete`。

> **当前范围修正（用户确认）**：本任务只做 WorkflowHub M15 看板数据，不操作任何外部项目。T016 中历史记录里的外部项目命令和 T014 中历史 host 名称只保留为不可变 provenance；本次继续执行不得复用或追加这些操作。

## Final aggregate scope

最终交付前必须重新保存以下事实，不能用旧记录代替：

- `npm run check`；五个 M15 focused test；`tests/integration/vnext-official-stage-run.test.mjs`；`tests/e2e/vnext-five-stage-current.test.mjs`。
- `isolated-browser-qa` 当前页面验收，以及 task/project/global/data.js/HTML 的同源读回。
- 旧 outcome `quality/evidence/stage-outcomes/build-code/6fdae3bb71b56e36614bebc652907d3c3b768f5729417d481753fc8d8b08bf3c.json` 的过期事实，以及当前真实宿主 outcome `cf48b572236eae101b3b72955851badb39f7f2cece67568ab174410ace2fa658` 的绑定和 official CLI 读回。
- `npm test -- --run` 当前完整结果为 `exit=0`；历史归档诊断漂移只保留为 non-gating 事实，不改写历史清单。
- 最终 `quality/verify.json`、`quality/evidence/verification.json`、`quality/evidence/verify-evidence.json` 和 `tasks.md` 的一致回读。

## Final aggregate verification

Final aggregate 由 T016 唯一维护，至少包含：`npm run check`、五个 M15 focused test、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`、isolated browser QA、facts-preserving rebuild，以及当前完整 `npm test -- --run` 结果。每项记录命令、exit、snapshot/material hashes、oracle 和 evidence ref。

当前状态：`incomplete`。T014 current outcome、official delivery、fresh browser 和派生重建都已有证据；但 receipt 的执行质量是 `incomplete`，source status 是 `missing`，因此 AC-001/AC-010 和 formal acceptance 保持 incomplete。不得把 CLI exit 0、fixture E2E、focused tests 或 advisory review 改写为质量完成。

## Completion Area

本文件的任务完成状态只由各卡的“执行状态填写区”记录；build-plan 不勾选任务完成，不写执行命令结果，不提前填写 review 或 verify 事实。

## 当前继续执行事实（2026-08-18）

- **事实**：当前 M15 `facts.jsonl` 里本来有真实的 step/skill/token/duration 记录，但旧记录带有 `execution_id`、`started_at`、`completed_at`；读取合同不认识这些字段，projector 因此把它们丢掉，页面才显示成 0。该根因不是历史事实缺失，也不是把历史重新采集一遍。
- **修复**：监控事实合同和 JSON Schema 现在严格接受这些已有的执行元数据；仍拒绝未知字段、坏时间和路径型标识。原始 M15 `facts.jsonl` 未改写，旧 `partial/fatal` 仍只按历史事实读取。
- **修复**：当隔离测试或不同 HOME 下读到别的 Codex handoff 时，不跨 HOME 读取，也不让整个成功的 stage run 丢掉 sidecar；改为写出 source unavailable/partial 的诚实事实。当前 `tests/m15-monitoring-integration.test.mjs` 为 `34 passed`，`tests/m15-monitoring-facts.test.mjs` 为 `18 passed`。
- **当前回读**：M15 当前 fresh run `workflow-m15-fresh-20260818-r2` 读回 `57/63` 个 step 为 completed、`21/30` 个 skill 为 executed；总 token `1231614`，总耗时 `881525 ms`；缺口仍显示 incomplete/skipped/unavailable，不补零。
- **页面派生物**：只更新了 M15 task projection，并用 `preferDerived=true` 重建全局页面派生物；没有扫描或重写外部项目 canonical facts，也没有操作 Multica。页面现在真实显示 M15 `阶段 5/5、步骤 63/63、技能 25/30`，步骤/技能行能显示 token 和毫秒耗时，证据点击打开固定右侧抽屉。
- **真实页面 QA**：使用隔离 `agent-browser` 打开临时本机静态服务，选择 M15、展开全部阶段、回读步骤/技能 token 与耗时、点击证据打开 `role=dialog` 右侧抽屉并截图 `/tmp/m15-after-data-fix.png`；console 无错误，浏览器会话和临时服务已清理。该结果证明数据现在能显示，不证明 M15 已完整或可 close。
- **修复事实（2026-08-18 自动绑定）**：普通 WorkflowHub 会话现在由 `task-bootstrap` 把当前项目 hook 登记的会话绑定到一个真实 task；后续 step/skill/spec-analyze 私有记录命令不再要求手填 `--task-id`。没有绑定、尝试换 task 或 task 路径不一致时直接失败，不把别的 task 的事件混进来。`tests/m15-codex-session-hook.test.mjs`、`scripts/__tests__/task-bootstrap.test.mjs` 共 `14` 个测试通过。
- **修复事实（2026-08-18 阶段和 token 隔离）**：spec-analyze 改为按 `task + stage` 保存和读取；Codex transcript 只接受 `[started_at, ended_at)` 半开时间窗；只有 `last_token_usage` 计入本次成本，累计 `total_token_usage` 和窗口外事件不再冒充本次 token。M15 integration/facts/hook/bootstrap 定向测试共 `67` 个通过；build-spec unavailable review 合同定向测试通过，保留 `unavailable`，不再错误降成 `missing`。
- **修复事实（2026-08-18 页面成本键）**：页面原先只查带多级前缀的 skill key，实际 `skill` breakdown 使用裸 skill id，导致已采集 token 显示“未采集”。现在页面先查裸 key，再兼容带前缀 key；真实浏览器回读已看到 `spec-analyze 4683057 tok`、`talk-with-zhipeng 640595 tok`，技能耗时也显示毫秒值。
- **最新真实页面 QA**：隔离 `agent-browser` 打开 `workflowhub-monitor.html`，选择 `m15-runtime-observability-repair`，页面显示结构化覆盖阶段 `5/5`、步骤 `63/63`、技能 `25/30`，成本页能看到 skill token/duration，点击证据打开固定右侧 `role=dialog` 的“受控来源引用”抽屉；console 无错误，临时服务和浏览器已清理。历史 M15 仍是 `partial`，缺失事实没有回填，任务仍不能 close。
- **宪法与定向验证**：`node tools/cli/verify-structure.mjs` 通过；`node --check`、`git diff --check` 通过；`runtime-facade`/artifact path contract 共 `12` 个测试通过。没有跑全量测试，没有修改 Multica、历史 canonical facts 或外部项目。
- **修复事实（2026-08-18 public-run cwd seam）**：真实闭环定向测试发现 public `run` 入口收到了隔离会话 `cwd`，但调用会话 outcome 读取器时漏传 `cwd`，会误读当前工作目录绑定的另一个 task。现在已把同一个 `cwd` 继续传入 `bindCurrentSessionOutcome`；错误 task 不再串入当前 run。
- **真实闭环验证（2026-08-18）**：`task-bootstrap.mjs` CLI 绑定真实 task 后，step/skill/spec-analyze 全部不带 `--task-id` 写入；再从 `stage-runtime.mjs run --action=execute --stage=make-decision` CLI（同样不带 project/task）消费同一会话并完成 official run。新增测试同时从 Codex transcript 读取两个真实 token 窗口，并回读 canonical monitoring facts 的 step/skill token 与 duration；该 public-run 用例通过，`task-bootstrap` 4 个、会话 hook 10 个定向测试通过。
- **边界事实**：本次隔离 E2E 证明“正常 WorkflowHub 入口的自动绑定、自动记录和 public run 消费”已经接通，不等于当前 Codex 对话已重新加载项目 hook，也不等于历史 M15 已回填。当前真实会话仍绑定 `workflowhub-execution-flow-repair-20260818`，未把它改绑到 M15；M15 formal acceptance 仍保持 `incomplete`。
- **修复事实（2026-08-18 自动阶段绑定）**：阶段入口带有明确 project/task 时，会在当前已登记且尚未绑定的会话中自动完成 task binding；已有其他 task 绑定时在入口处直接拒绝，不会覆盖或串写。工作流五个阶段文档已说明该行为，`task-bootstrap` 仍作为新任务/单独启动任务的内部入口。
- **真实闭环验证（2026-08-18 自动阶段绑定）**：隔离 CLI 流程改为先调用 `stage-runtime status --action=begin --stage=make-decision --project=... --task=...` 自动绑定，再用不带 task id 的 step/skill/spec-analyze 事件，最后用不带 project/task 的 `stage-runtime run` 完成；public run 仍回读 step/skill token 与 duration。该用例通过；当前真实会话尝试显式进入 M15 时以绑定不一致退出，证明安全拒绝仍有效。
- **收尾定向验证（2026-08-18）**：M15 monitoring integration 与 make-decision artifact path contract 共 `39` 个测试通过；`node --check tools/cli/stage-runtime.mjs`、`git diff --check`、`node tools/cli/verify-structure.mjs` 均退出 `0`。未跑全量测试；该结果只证明本轮改动的代码、合同和宪法结构没有回归，不替代新鲜 M15 正常会话的真实 host receipt。
- **正常入口边界审计（2026-08-18）**：真实当前 Codex 会话的 handoff 已看到 `20` 条事件，其中 `10` 个 step、`10` 个 skill、`16` 条已结束、`14` 条带 token；说明正常会话正在写入 step/skill 生命周期。该会话绑定的是 `workflowhub-execution-flow-repair-20260818`，不是 M15，因此未把它投影到 M15。阶段入口/`task-bootstrap` 负责自动绑定，private event helper 负责语义边界；用户不需要手工提醒，但不能声称 Codex 主机能从任意自然语言自动猜出 step/skill 边界，缺少边界事件时必须保持 incomplete。
- **页面自动更新审计（2026-08-18）**：当前配置 `task_dir=/Users/Hugh/Hugh/Knowledge`，`rebuildGlobalMonitoringSnapshot` 的输出目录是 `/Users/Hugh/Hugh/Knowledge/Projects`，正好对应用户打开的 `workflowhub-monitor.html` 和 `workflowhub-monitor-data.js`；正常 `stage-runtime run` 会原子更新 data.js 和 HTML，不需要手工复制。已确认页面文件最新时间为 `2026-08-18 21:00:58`；未用其他 task 的 run 去覆盖 M15。
- **fresh M15 事实复核（2026-08-18）**：M15 `facts.jsonl` 已有同一 `run_id=workflow-m15-fresh-20260818-r2` 的五个阶段，共 `697` 条 fresh facts；source 在 `make-decision` 为 `present`，注册的 Codex session 是 `01a012a6-9f10-79a1-9adc-96a90ec5abc2`，后四个阶段的 source status 仍是 `missing/no_registered_source`。五阶段 outcome 都是 `incomplete`；skill 最终状态为 `22 present、1 incomplete、3 skipped、6 unavailable`，不是投影漏掉 5 个 skill。该复核证明“已有 fresh M15 运行记录”，但不能把后四阶段 source 缺失或质量 incomplete 改写成完成；`quality/verify.json` 的 formal status 继续保持 `incomplete`。
- **页面提示与投影回归修复（2026-08-18）**：`no_registered_source` 改成用户可直接理解的提示：“当前会话没有接入记录器，无法采集真实 token 和耗时”；同步更新实际页面 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub-monitor.html`。同时修正投影测试样例：原样例把当前合同已经支持的 `execution_id` 当成旧字段，改为真正未知字段；`tests/m15-monitoring-projector.test.mjs` 为 `22 passed`。页面从正确根目录重建后为 `16` 个任务、整体 `partial`、覆盖 `26/42`，没有修改 canonical facts、历史数据、Multica 或外部项目；宪法结构检查和 `git diff --check` 均通过。
- **跨阶段成本汇总修复（2026-08-18）**：发现成本汇总只要存在任意一个普通 token/duration，就会丢掉其他阶段的 `stage_outcome` 成本；同时 stage 明细会把 stage、step、skill 三层 outcome 重复相加。现在按阶段选择：该阶段有普通记录就用普通记录；没有普通记录才取该阶段最粗的 outcome；step/skill 仍保留明细；无法归属阶段的成本进入 `unknown` 桶，不填零。新增跨阶段和 unknown 桶回归，`tests/m15-monitoring-diagnostics.test.mjs` 为 `42 passed`，与 projector 合计 `63 passed`。页面重建后 M15 总 token `58,261,995`，五个 stage 相加同为 `58,261,995`；总耗时 `3,176,206 ms`，五个 stage 相加同为 `3,176,206 ms`。页面仍保持 `partial`，未修改 canonical facts、历史数据、Multica 或外部项目。
- **最新页面冒烟（2026-08-18）**：隔离 `agent-browser` 打开实际生成页面，选择 `m15-runtime-observability-repair` 后回读 `63/63 step`、`25/30 skill`、总 token `58,261,995`、总耗时 `3,176,206 ms`；按阶段 token/耗时与总数一致；点击证据按钮打开固定右侧 `role=dialog` 抽屉；console/errors 为空。只复用本次隔离 session，不复用登录态，不切换浏览器引擎；浏览器 session 和临时静态服务均已清理。该证据证明页面能显示当前已有事实，不证明 source 缺口或质量 incomplete 已消失。
