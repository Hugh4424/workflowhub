# 实现计划：M17 repo-contained skills 运行时适配 + 多 CLI 兼容验证（17 项四批 + 质量收尾）

- **Input**：`specs/workflowhub-m17-repo-skills-multicli-20260903/decision-log.md`（D-001~D-010）、`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md`（FR-A-001~FR-C-017、AC-A-001~AC-C-001，方向按 D-010 重对齐）
- **Template version**：`plan-task.v3`
- **Current-material audit**：四材料为本计划唯一工作真相；历史 receipt/review 只读。

## 速读卡

- **Goal**：17 项工作按 D-005 四批执行——簿记批（孤儿技能裁定/登记同步/目录真相表修复）→ 纯归位批（死代码删除/双副本收敛/现行契约路径核验/能力清单迁移，零行为变更）→ 多 CLI 批（死约定删除/显式身份与 Stage Agent outcome 契约/Claude 宿主结果接线/文档对齐）→ 留证验收批（清单生成器/指标扫描/X 处置/CLI 映射文档/归一契约测试/干净安装留档）；当前 main 已提供核心显式 identity/outcome 实现，本批以契约验证为主，只有发现缺口才做窄修复；追加 B5 只补当前任务已缺的五类质量事实，不扩生产实现，共 22 张任务卡。
- **Non-goals**：Kimi 接线与格式调研；F1 seam 泛化/cli_map、F2 task-close/artifact-dir 迁移与 facts 双轨、F3 函数级拆分去桶；capability 扩展；合并技能族；全量防外部路径测试；任何 UI 工作；任何新控制面/双写/永久兼容桥（来源：decision-log 非目标节、D-002/D-003、spec 第 2/10 节）。
- **Deletion boundary**：`skills/qa-only/`、`skills/verify-change/`（T1，删除条件=逐项无消费者证明+用户授权，G-003 已满足）；`core/fact-indexes.mjs`（T4，无消费者）；review 双副本旧位（T5，收敛为薄转发+删除条件）；skills/workflowhub-host-protocol/SKILL.md 第 75/76 行死约定（T8，D-008）。
- **Before**：无权威打包清单、无 CLI 映射文档、无 Codex 核实记录；旧计划依赖宿主 session 绑定与 Claude transcript 定位；孤儿技能/死约定/目录真相表漂移占账面。
- **After**：catalog→manifest 生成器+漂移 diff；metrics 扫描挂现有 checker；显式 `--project/--task` 或认证 worktree；Claude/宿主显式结果经现有 bridge 生成 outcome 并由 public run 消费；十条验收逐条最小留证；账面与现实一致。
- **Main risk**：归位批触碰 stage-content-contracts 被 spec-stage-artifact-closure.test 源正则引用（RISK-P-01）；Claude 宿主未提交结构化 outcome 或绑定不匹配（RISK-P-02）；broker provider 身份失效影响审查覆盖（RISK-S-03 承接）。
- **Next step**：进入 B5 证据补录：在不改代码、不重做计划审查的前提下，按当前 build-code 结果补齐 acceptance criteria、stage-end spec-analyze、finding dispositions、integration review、stage outcome。已有事实直接复用并绑定当前身份；外部事实不可用就登记 `unavailable`，不伪造通过；不重跑 `test:safe`/`npm test`。

### Current execution status (2026-09-05)

- main 已在任务分支以 fast-forward 合入到 `248a7de36ab82fe0fb103f34a7e5a355da14006c`，当前材料已按 D-010 重对齐；该提交补强现有 wh-review 的 provider 材料路径脱敏、身份降级错误码保留及对应测试，不改变 M17 的 FR/AC 或批次顺序；不需要额外 merge commit。
- B1~B4 的实现、focused tests、clean-install 和当前 receipts 已落地；clean-install 已覆盖安装副本的确定性五阶段 public task，但仍不等于受支持宿主实际完成业务任务。真实 Claude/DSH frontend、Knowledge 回写、独立审查和 AC-A-001/AC-B-001/AC-C-001 的剩余验收边界保持可见。
- 最终两次异源 `wh-review` 因本机 broker `PROCESS_TIMEOUT` 为 `unavailable`；这不是空 findings，也不是 verify-code 入口许可。

## Technical Context

### Global Constraints

- **零行为变更防线**：B2 纯归位批与 B1 簿记批不得改变任何运行时行为；原规范的批末全量绿灯要求仍是质量标准，但按用户 2026-09-05 明确要求，本任务不再重跑 `test:safe`/`npm test` 全量回归，保留既有失败事实并以受影响域 focused tests 继续核验。
- **无新控制面**：不新增公共运行时行为类、配置面、双写或兼容桥；metrics 扫描挂现有 checker；Claude/宿主复用现有 Stage Agent bridge，runtime 保持零宿主特定路径与 transcript 读取。
- **旧记录只读**：旧任务记录/receipt/review 只读保留；删除项经 git 历史可恢复。
- **目录真相表唯一事实**：docs/architecture/move-map.json 是目录迁移唯一事实；未列入文件保持原位；新增文件必须先登记职责与消费者。
- **身份与结果契约**：调用方显式提供 `--project/--task` 或使用认证 task worktree；Stage Agent bridge 要求显式 task/stage/attempt 与 `agent_run_id`，缺结果为 `unavailable`；旧 session/env/v2 仅作历史事实（D-010）。
- **Testing**：Vitest；契约测试 tests/contract/；RED/GREEN 每行为变化成对共用 gate_cmd；归位批以既有域级契约测试为回归网。按用户 2026-09-05 明确要求，不再运行 `test:safe`/`npm test` 全量回归；只执行受影响域 focused tests，既有全量失败事实保留为历史质量事实。
- **Target environment**：本地 CLI+单机文件系统；宿主 Claude Code/Codex/DSH；Kimi 不在本次范围。

## Code Anchors

- `skills/catalog.yaml`：技能目录登记（机器真相），含 metrics_enabled 字段位。
- `skills/reuse-registry.md`、`docs/reuse-registry.md`：复用登记双份（同步对象）。
- `docs/architecture/move-map.json`：目录真相表。
- `skills/qa-only/`、`skills/verify-change/`、`skills/resolving-merge-conflicts/`：孤儿三技能。
- `core/fact-indexes.mjs`：无消费者死模块；`core/parse-framework-config.mjs`：去留评估对象。
- `runtime/review/`（canonical-review-result/review-output/review-policy 等）：双副本收敛目标区。
- `runtime/stage/stage-content-contracts.mjs`（约 301KB）：main 已提供的现行权威路径；`tests/contract/spec-stage-artifact-closure.test.mjs:36-41` 对其有源正则引用（不触碰 845 行巨型函数、不清理死导出）。
- `core/task-capability.mjs`：迁移对象。
- `tools/cli/stage-runtime.mjs`（显式 identity 解析）、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`：显式身份与 Stage Agent outcome 接线区。
- `skills/workflowhub-host-protocol/SKILL.md:75-76`：两行死约定。
- `tools/architecture/clean-install.mjs`：干净安装留档入口。
- `skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/skill-bundle.json`：X3 engines 风格声明落点。
- 新文件（登记后创建）：`tools/cli/repo-skills-manifest.mjs`（清单生成器）、`docs/cli-tool-mapping.md`、`docs/research/` 三份调研归档、`docs/operations/codex-support-verification.md`、`docs/operations/claude-e2e-sample.md`。

## Solution Design

- **清单生成器（FR-A-001，排在 catalog 补 metrics_enabled 之后）**：纯函数式 CLI，读 catalog.yaml 逐条目映射为 manifest 记录（id/path/version/origin_path/origin_framework/local_changes/owner_stage/metrics_enabled），其中两个 origin 字段始终是按 upstream 顺序对齐的数组；写 repo-skills.manifest.json；`--check` 模式输出逐字段 diff，exit 非零表示漂移。不做缓存、不做监听、不反向写 catalog。
- **指标扫描（FR-A-002）**：在现有依赖技能检查器（既有 4 个防外部路径合同测试所属 checker 族）中增加 metrics_enabled 报告段；核心技能口径=五阶段入口技能+依赖闭包（spec §5 FR-A-001 定义），以 catalog 字段判定；漏报即测试失败。
- **显式身份（FR-B-008）**：复用 main 已实现的 `--project/--task` 或认证 worktree 身份解析；测试部分提供、冲突身份、无认证上下文的 fail-closed 结果；bridge 的 `project_name/task_id/task_path/stage/attempt_id/agent_run_id` 必须显式绑定，禁止读取宿主 session 或旧环境变量。
- **Claude/宿主 outcome（FR-B-009）**：不新增 transcript adapter。Claude/宿主提交已执行的 `session` 或 `unavailable` 结果给现有 bridge；bridge 校验当前 task/stage/attempt/snapshot/material 并生成 `workflowhub-stage-outcomes.v1`，public run 消费 `outcome_ref`；缺结果、绑定冲突、验证失败保留 `unavailable`/失败，不从 transcript 或评论反推。
- **归位纪律（FR-C-013~016）**：删除/搬迁/收敛全部经 move-map 先登记后执行；`stage-content-contracts` 以 main 已提供的 `runtime/stage/` 权威路径为准，本任务只核验路径、导入图和 move-map/hash，不再移动或新增旧位转发。
- **留证最小化（D-001）**：每个记录类产出只做最小版本——一个汇总文档、一个测试文件、一次存档输出。

## File Boundary

### NEW

- `tools/cli/repo-skills-manifest.mjs`、`repo-skills.manifest.json`
- `docs/cli-tool-mapping.md`、`docs/operations/codex-support-verification.md`、`docs/operations/claude-e2e-sample.md`、`docs/operations/clean-install-archive.md`、`docs/operations/deferred-tasks-m17.md`、`docs/research/`（三份调研归档）
- `tests/contract/repo-skills-manifest.test.mjs`、`tests/contract/metrics-enabled-report.test.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/contract/cli-parity.test.mjs`、`tests/e2e/claude-outcome-packet.test.mjs`
- `tests/fixtures/host-outcome/`、`tests/fixtures/claude-outcome/`、`tests/fixtures/catalog-drift/`、`tests/fixtures/metrics-scan/`
- `runtime/task/task-capability.mjs`（迁入）；`runtime/stage/stage-content-contracts.mjs` 已由 main 提供现行权威路径，本任务只核验其归位事实，不新增 `runtime/schemas/stage-content-contracts.mjs`

### MODIFY

- `skills/qa-only/`（删除）、`skills/verify-change/`（删除）、`skills/catalog.yaml`、`skills/reuse-registry.md`、`docs/reuse-registry.md`
- `core/fact-indexes.mjs`（删除）、`core/parse-framework-config.mjs`、`core/task-close.mjs`、`core/task-capability.mjs`（迁出）
- `runtime/review/`、`runtime/review/stage-review-disposition.mjs`、`skills/wh-review/scripts/`（review 双副本旧位）、`runtime/stage/stage-content-contracts.mjs`（核验 main 已完成的归位，不再移动）、`skills/wh-review/scripts/`（review 双副本旧位收敛为薄转发）、`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/task/task-kernel-implementation.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/cli/stage-runtime.mjs`、`tools/cli/validate-field-mapping.mjs`
- `quality/facts/m17-acceptance-criteria.json`、`quality/facts/m17-stage-end-spec-analyze.json`、`quality/reviews/results/m17-finding-dispositions.json`、`quality/reviews/results/m17-integration-review.json`、`quality/evidence/stage-outcomes/build-code/<sha256>.json`（只追加当前质量事实）
- `skills/workflowhub-host-protocol/SKILL.md`、`AGENTS.md`、`CONTEXT.md`、`README.md`
- `skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/third-review-host-config.mjs`
- `docs/architecture/move-map.json`、`tests/contract/`（checker 族）、`tools/architecture/clean-install.mjs`

### 禁止触碰

- `runtime/stage/stage-runner.mjs` 巨型函数区、`runtime/task/task-kernel-implementation.mjs` 行为区（仅 T6 导入路径更新）、guard 类检查器逻辑（check-anti-host 等零改动，D-004）、facts 存储（F2 延期）、任何 node_modules。旧记录只读；删除项经 git 历史可恢复。

## Technical Decisions

### DEC-01 清单生成器落点
- **Selected**：reuse `tools/cli/` 新文件（既有 CLI 区，无新机制）
- 否决放 runtime/：生成器是维护工具非运行时；复杂度：低。

### DEC-02 显式身份与 outcome 边界
- **Selected**：复用 main 的显式 `--project/--task`、认证 worktree、Stage Agent bridge 和 public run；旧 session/env/v2 不作为当前输入（D-010）
- 否决恢复旧宿主绑定（违反 ADR-0024）；否决新增 Claude transcript 扫描或第二套 dispatch（重复控制面）；复杂度：低。

### DEC-03 Claude/宿主结果接线落点
- **Selected**：不新增 Claude 专用 adapter；宿主显式提交 `session`/`unavailable`，复用 `tools/host/workflowhub-stage-agent-bridge.mjs`，由现有 outcome adapter 写入 canonical stage outcome（D-010）
- 否决 runtime 读取 transcript（破坏宿主中立）；否决目录探测/历史反查（隐式绑定）；复杂度：低（结构化结果绑定与负例验证）。

### DEC-04 stage-content-contracts 归位方式
- **Selected**：以 main 已完成的 `runtime/stage/stage-content-contracts.mjs` 为唯一现行路径；本任务只校验其存在、当前导入方和 move-map/hash 对齐，不新增旧位转发。
- 否决再次移动、拆分或清理死导出（混入行为风险，归 F3 延期）；复杂度：低（不改变现行实现，只保留路径与契约事实）。

### DEC-05 指标扫描接法
- **Selected**：挂现有 checker 报告段（reuse）
- 否决新建扫描控制面（违反无新控制面）；复杂度：低。

### DEC-06 批次划分
- **Selected**：四批（簿记→纯归位→多 CLI→留证验收，D-005）
- 否决三批（归位防线弱）；否决不分批（爆炸半径大）；复杂度：低。

## Test Strategy

- 风险优先级：归位混入行为变更 > 身份兼容破坏现有流 > 清单口径漂移 > 适配器误解析 > 留证伪造。
- 场景与 oracle：B3 的 T9/T11 先对当前 main 做契约回归验证，只有明确缺口才由 T10/T12 窄修；B4 的行为变更两对 RED/GREEN（T14/T15、T16/T17）共用 gate_cmd，RED 期望非零、GREEN 期望 0；非行为卡以受影响域 focused tests+抽查断言为 oracle，历史全量失败事实单独保留。
- fixture：Claude/宿主显式 outcome `session` 与 `unavailable` 样例（不含 transcript bytes）入 tests/fixtures/；task/stage/attempt/snapshot/material 冲突样例；catalog 漂移样例。
- 覆盖限制：non_ui 无浏览器层；Claude E2E 可用结果包回放验证 bridge→public consumer，但不能替代真实 Claude CLI；当前 T20 parity 也只覆盖共享 bridge 的两种 packet，真实 Codex/DSH frontend 仍需外部接线或用户确认范围；Kimi 不覆盖。

## Rollback and Recovery

- 删除证明：qa-only/verify-change 经 G-002 全仓核查零消费者（verify-code 已于 e294f09d5 裁掉引用；review-packet.v1 无生产者）且用户已授权（decision-log G-003）；core/fact-indexes.mjs 零消费者（T4 反向引用扫描证明先行，发现活消费者即 STOP 改登记）；review 双副本旧位仅收敛为薄转发、删除条件另记不立即删除；host-protocol 两行死约定无代码兑现（F-004 文本+历史双向核查）。全部删除经 git 历史可恢复。
- 全部改动可 git revert；删除项经 git 历史恢复；归位批任一契约测试红即整批 revert 重排。
- 测试失败回退到对应 RED 卡修正构造；生产改动越界即 STOP 回本卡。

### Engineering Risk Handoff

- **RISK-P-01**（stage-content-contracts 归位被源正则引用）
- **Affected IDs**：T6
- **Trigger**：spec-stage-artifact-closure.test 等以源码正则锚定旧路径/旧导出形态
- **Consequence**：归位后测试红，批次阻塞
- **Mitigation or STOP**：先跑该测试确认锚点形态，桶式转发保持旧导入路径可用；不可调和即 STOP 回本卡
- **Handling Stage**：build-code（B2 批）
- **Verification**：受影响域 focused tests 全绿+归位 diff 仅路径与转发；不再重跑全量回归

- **RISK-P-02**（Claude 宿主未提交结构化 outcome 或绑定不匹配）
- **Affected IDs**：T9、T10、T11、T12、T19、T20
- **Trigger**：宿主缺少 `session`/`unavailable` 结果，或 task/stage/attempt/snapshot/material 任一身份不匹配
- **Consequence**：bridge 无法生成可认证 outcome，若错误兜底会伪造阶段完成
- **Mitigation or STOP**：显式字段校验；缺结果保持 `unavailable`；绑定失败原样保留并停止该次事实写入；禁止 transcript/评论反推
- **Handling Stage**：build-code（B3 批）
- **Verification**：显式身份完整/部分/冲突/无认证上下文与 bridge 缺字段负例断言；不读 transcript

- **RISK-S-03**（承接：broker provider 身份失效）
- **Affected IDs**：T20
- **Trigger**：grok 等 provider PROVIDER_IDENTITY_INVALID 持续复发（本任务 make-decision/build-spec 两轮均已发生）
- **Consequence**：异源审查覆盖降级，但 minimum_heterologous=1 可满足
- **Mitigation or STOP**：如实保留失败类别；用户择机核查 broker 配置（已入复盘）
- **Handling Stage**：build-code/verify-code
- **Verification**：审查结果失败类别原样入档

- **RISK-P-04**（move-map 与归位执行不一致）
- **Affected IDs**：T3、T4、T5、T6、T7
- **Trigger**：归位批实际移动与 T3 登记条目不符
- **Consequence**：目录真相表再次失真
- **Mitigation or STOP**：每个归位卡动作含 move-map 同步更新；T7 末按受影响域核对，历史全量失败事实不覆盖
- **Handling Stage**：build-code（B2 批）
- **Verification**：move-map 抽查全中（AC-C-001）

## Implementation Order

B1（T1→T2→T3 串行）→ B2（T4→T5→T6→T7 串行，move-map 单文件纪律）→ B3（T8→T9→T10→T11→T12→T13）→ B4（T14 RED→T15 GREEN→T16 RED→T17 GREEN→T18→T19→T20→T21）→ B5（T22）。T9/T10/T11/T12 以当前 main 的显式 identity/outcome 契约为基线验证；B5 只补当前证据，不扩生产实现。批间硬串行（D-005）。

## Dependencies and Parallelism

- 串行硬依赖：B4 批内 metrics 字段先行（T14/T15）再做清单生成器（T16/T17），清单生成物才能固定含 metrics_enabled 全字段；B2 四卡串行（共享 move-map 写纪律）；T10 依赖 T9 的显式 identity/outcome 负例；T12 依赖 T11 的 Claude outcome packet 负例；T13 依赖 T10/T12（文档对齐需最终 bridge 口径）；T19 依赖 T12（E2E 样例需 outcome 落地）；T21 依赖 T20（总验收最后跑）；B5 的 T22 在现有实现和 receipts 上一次性补齐五类事实，缺失事实保持 `unavailable`。
- 并行安全：无跨卡并行（爆炸半径纪律优先于速度，D-005 四批已提供隔离）。
- 外部依赖：Claude/宿主必须能够生成结构化 `session`/`unavailable` 输入；不要求安装 hooks，不允许用 transcript 探测替代显式结果。公共 runtime status/测试依赖仓库安装的 `ajv`，缺失时记录真实 `unavailable`。

## Requirement and Verification Traceability

| source | FR | AC | tasks | oracle |
| --- | --- | --- | --- | --- |
| D-009/G-003 | FR-C-011 | AC-C-001 | T1 | 目录删除+登记条目断言 |
| D-001 | FR-C-012 | AC-C-001 | T2 | 双份登记 diff 为空 |
| R-004/FND-005 | FR-C-017 | AC-C-001 | T3 | move-map 抽查+归档登记 |
| D-005 | FR-C-013 | AC-C-001 | T4 | focused tests+评估结论落盘 |
| D-005 | FR-C-014 | AC-C-001 | T5 | 双副本收敛+转发删除条件 |
| D-005 | FR-C-015 | AC-C-001 | T6 | 归位 diff 零逻辑变更+focused tests |
| D-005 | FR-C-016 | AC-C-001 | T7 | 迁移登记+move-map 全量核对 |
| D-008 | FR-B-007 | AC-B-004 | T8 | 文档行删除+grep 零引用 |
| D-010/ADR-0024 | FR-B-008 | AC-B-002 | T9,T10 | explicit identity/outcome bridge 绑定与 fail-closed 断言 |
| D-010 | FR-B-009 | AC-B-001,AC-B-002,AC-B-004 | T11,T12 | Claude explicit outcome packet + bridge/run 归一断言 |
| D-001 | FR-B-010 | AC-B-003 | T13 | 文档口径一致性核对 |
| M17a-2/D-001 | FR-A-001 | AC-A-002 | T16,T17 | repo-skills-manifest.test 字段+diff |
| M17a-5 | FR-A-002 | AC-A-005 | T14,T15 | metrics-enabled-report.test 漏报断言 |
| M17a-3 | FR-A-003 | AC-A-003 | T18 | 三入口核对+声明存在断言 |
| M17b-2/3/5 | FR-A-004 | AC-B-003,AC-B-005 | T19 | mapping 覆盖核对+核实记录存在 |
| M17b-1/4 | FR-A-005 | AC-A-004,AC-B-001,AC-B-002,AC-B-004 | T20 | cli-parity.test+claude-outcome-packet e2e |
| M17a-1/D-001 | FR-A-006 | AC-A-001 | T21 | clean-install 存档+解析命中清单 |
| D-001/D-007/D-010 | FR-A-001~FR-C-017 | AC-A-001~AC-C-001 | T22 | 一次补录五类当前质量事实 |

## Governance Synchronization Matrix

| 文件 | 动作 | 时机 | 依据 |
| --- | --- | --- | --- |
| docs/architecture/move-map.json | 修复+逐批同步登记 | T3 起，B2 每卡 | AGENTS.md 治理边界 |
| skills/catalog.yaml | 孤儿条目删除+消费者登记+metrics_enabled | T1、T16/T17 | D-009、FR-A-002 |
| skills/reuse-registry.md + docs/reuse-registry.md | 双份同步+词表+审计记录 | T2 | FR-C-012 |
| CONTEXT.md | no-change（术语不变） | — | decision-log 文档结果节 |
| AGENTS.md/CLAUDE.md | 仅文档对齐段（显式身份/outcome bridge/新文件职责） | T13 | FR-B-010 |
| Knowledge roadmap.md/progress.md | 回写 M17 进展 | T3 | FR-C-017 |
| docs/research/ 三份调研 + 延期文档 | 归档进仓+move-map 登记 | T3 | D-003、FND-005 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"e400d447d94a68fc629ac05acb23c807e34a5c929a5bd723c91c9b02dfc16732","id":"workflowhub-constitution","version":"1.7.0","clause_count":22}`
- F1 薄核心：生成器/适配器全部下沉 tools/ 层，runtime 仅 T6 纯归位 ✓
- F2 窄契约：显式 identity/outcome/manifest/CLI 映射均为明确 schema，不暴露内部 ✓
- F3 四材料决定推进：本计划只消费四材料；发布走既有 public run ✓
- F4 质量靠异源审查与人：review-plan 一轮异源+finding 处置不锁修复 ✓
- F5 gate 谨慎：原批间门禁包含 `npm test` 全绿（既有测试）；本任务按用户要求不重跑全量，保留历史失败事实并以 focused tests 核验，不新增 gate
- F6 统一外置执行记录：不把旧记录当准入；删除项 git 历史可恢复 ✓
- F7 三处确认与不可逆独立授权：本阶段末取用户确认；commit/merge 另行 authorize ✓
- F8 简单优先：复用显式 bridge>新增 adapter、挂现有 checker>新扫描面、纯归位>顺手重构 ✓
- F9 可证伪不假绿：漂移 diff、漏报断言、unknown 分支均可证伪 ✓
- F10 自动化按真实收益：只加与十条验收直接对应的测试，无新增基建 ✓
- F11 正常执行优先、控制面受限：零新控制面；Claude/宿主复用现有 bridge，WorkflowHub 不读 transcript ✓
- Q1 质量事实非许可：review/test 仅事实，不作 pass gate ✓
- Q2 推进/发布/完成分离：批次推进靠四材料，质量事实独立记录 ✓
- Q3 异源独立上下文：wh-review 保持 broker 异源，失败类别原样保留 ✓
- S1 能用外部不造轮子：X2/X3/X4 保持独立 repo+薄入口 ✓
- S2 外部技能可针对项目改造合宪：catalog 登记 local_changes ✓
- S3 技能窄接口：孤儿删除与消费者登记保持接口窄化 ✓
- S4 重活子代理：归位批扫描与测试采集按 AGENTS.md 派工 ✓
- S5 事实如实：unknown/unavailable/missing 语义约定贯穿 ✓
- S6 最小材料：四材料不变，留证最小化 ✓
- S7 文档随代码：T13 文档对齐与实现同批 ✓
- S8 不绑单一宿主：显式 identity/outcome 与 Claude 接入正为此 ✓

## Phase B1 — 簿记批

### Goal
孤儿三技能裁定落地、复用登记同步、目录真相表修复+延期文档归档+知识库回写；账面与现实一致。
### Files
**MODIFY** `skills/qa-only/`（删除）、`skills/verify-change/`（删除）、`skills/catalog.yaml`、`skills/reuse-registry.md`、`docs/reuse-registry.md`、`docs/architecture/move-map.json`；**NEW** `docs/operations/deferred-tasks-m17.md`、`docs/research/`（三份调研归档）；Knowledge 侧 roadmap.md/progress.md 回写（仓外，不占边界）。
### Tasks
T1、T2、T3
### Verify
受影响域 focused tests 全绿；登记 diff 为空；move-map 抽查全中；历史全量失败事实保持可见，不再为本任务重跑全量回归。
### Knowledge
G-002/G-003 核查结论、F-004、batch-governance 删除先例。
### STOP
发现任一待删技能出现新消费者 → 停止回 build-plan。
### Done
AC-C-001 簿记部分证据齐（删除+登记+归档+回写）。
### Risks and rollback
全部可 git revert；删除项 git 历史可恢复。

## Phase B2 — 纯归位批

### Goal
死代码删除、review 双副本收敛、核验 main 已完成的 stage-content-contracts 归位、task-capability 迁移；零行为变更，契约回归事实完整记录。
### Files
**MODIFY** `core/fact-indexes.mjs`（删除）、`core/parse-framework-config.mjs`、`runtime/review/`、`runtime/review/stage-review-disposition.mjs`、`runtime/stage/stage-content-contracts.mjs`（核验 main 已完成的归位，不再移动）、`skills/wh-review/scripts/`（review 双副本旧位收敛为薄转发）、`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/task/task-kernel-implementation.mjs`、`core/task-close.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/stage-runtime.mjs`、`core/task-capability.mjs`（迁出）、`docs/architecture/move-map.json`；**NEW** `runtime/task/task-capability.mjs`（迁入）。
### Tasks
T4、T5、T6、T7
### Verify
每卡记录受影响域 focused test 事实；T6 核验 `runtime/stage` 权威路径、当前导入图与 move-map/hash 对齐，不再创建移动或转发改动；历史全量失败事实单独保留。
### Knowledge
F-004 域级契约测试清单、spec-stage-artifact-closure.test 锚点形态。
### STOP
任一归位需要改逻辑才能过测试 → 停止回本 Phase（改逻辑属 F3 延期范围）。
### Done
AC-C-001 归位部分证据齐（零行为变更证明+move-map 同步）。
### Risks and rollback
RISK-P-01/RISK-P-04；整批可 revert。

## Phase B3 — 多 CLI 批

### Goal
死约定删除、显式身份与 Stage Agent outcome 契约验证、Claude/宿主显式结果接线验证、文档对齐。
### Files
**MODIFY** `skills/workflowhub-host-protocol/SKILL.md`（删 75/76 行+对齐段）、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/cli/stage-runtime.mjs`（仅当前契约暴露缺口时）、`AGENTS.md`、`CONTEXT.md`、`README.md`；**NEW** `tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/fixtures/host-outcome/`、`tests/fixtures/claude-outcome/`。
### Tasks
T8、T9、T10、T11、T12、T13
### Verify
T8 grep 零引用断言；T9/T11 对当前 main 做契约回归验证；仅在暴露窄缺口时修生产代码；按用户要求不再以全量 `npm test` 作为本次继续执行命令。
### Knowledge
F-005（历史格式事实）、F-006、D-008、D-010、ADR-0024、当前 Stage Agent bridge 实现。
### STOP
需要读取/扫描 transcript、从宿主 session 猜身份、新增 Claude dispatch 或第二套控制面 → 停止回 build-plan。
### Done
AC-B-001/AC-B-002/AC-B-004 的显式身份、outcome bridge 与失败边界证据齐。
### Risks and rollback
RISK-P-02；宿主未提交结构化结果或绑定不匹配时只能记 `unavailable`/失败；无需 hooks，整批可 revert。

## Phase B4 — 留证验收批

### Goal
清单生成器+指标扫描+X 处置+CLI 映射文档与核实记录+归一契约测试与 Claude e2e+干净安装留档；十条验收逐条最小留证。
### Files
**NEW** `tools/cli/repo-skills-manifest.mjs`、`repo-skills.manifest.json`、`docs/cli-tool-mapping.md`、`docs/operations/codex-support-verification.md`、`docs/operations/claude-e2e-sample.md`、`docs/operations/clean-install-archive.md`、`tests/contract/repo-skills-manifest.test.mjs`、`tests/contract/metrics-enabled-report.test.mjs`、`tests/contract/cli-parity.test.mjs`、`tests/e2e/claude-outcome-packet.test.mjs`、`tests/fixtures/catalog-drift/`、`tests/fixtures/metrics-scan/`；**MODIFY** `skills/catalog.yaml`（metrics_enabled）、`tests/contract/`（checker 族）、`skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/reuse-registry.md`、`docs/architecture/move-map.json`、`tools/architecture/clean-install.mjs`。
### Tasks
T14、T15、T16、T17、T18、T19、T20、T21
### Verify
两对 RED/GREEN 共用 gate_cmd；T20 bridge-level parity+Claude public-route e2e focused green；T21 存档可复现；真实 CLI frontend、历史全量 npm test 和异源 review 的缺口必须保持可见，不能用 focused green 替代。
### Knowledge
PFACT-01/03/06、F-006（engines 风格/semver 区间）、spec §11 十条验收口径。
### STOP
任一验收条无法留证 → 停止并如实记录缺口（禁止伪造通过）。
### Done
当前仅完成 focused evidence；十条验收与 AC-C-001 未全部闭合，M17 不宣告完成，待外部事实、历史全量失败边界和独立质量事实处理后再判断是否进入 verify-code。
### Risks and rollback
RISK-S-03；留证从简防线（失败边界）。

## Phase B5 — M17 当前质量事实补录

### Goal
不再扩大 M17 生产实现，只补当前 build-code 已经暴露的五类质量事实：acceptance criteria、stage-end spec-analyze、finding dispositions、integration review、stage outcome。已有事实直接复用；外部事实不可用就留下绑定完整的 `unavailable`。

### Files
**READ/INVOKE** `tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-runner.mjs`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`
**MODIFY** `quality/facts/m17-acceptance-criteria.json`、`quality/facts/m17-stage-end-spec-analyze.json`、`quality/reviews/results/m17-finding-dispositions.json`、`quality/reviews/results/m17-integration-review.json`、`quality/evidence/stage-outcomes/build-code/<sha256>.json`（只追加当前事实）；不修改生产代码，不新增 public command、store、adapter、Knowledge writer 或 manifest 口径。

### Tasks
T22

### Verify
只执行必要的 public runtime/bridge 调用和已有窄证据复核；不执行 `test:safe`、`npm test` 或其他全量回归。所有新增事实必须绑定当前 task、stage、attempt、snapshot、material revision；所有不可用原因原样保留。

### Knowledge
承接 D-001、D-007、D-010、spec §8/§11，以及当前 `tasks.md` 中已记录的 `incomplete`/`unavailable` 事实；不新增 Knowledge 写回要求。

### STOP
需要恢复 transcript/session 推断、修改生产代码、把 replay 当真实宿主验收、重复无效 provider 重试，或需要全量回归才能继续时，停止并保留缺失事实。

### Done
五类事实均已登记并绑定当前快照；每项都明确 `covered`、`missing` 或 `unavailable`。若仍有缺失，继续保持 M17 的真实 `incomplete/not_released` 状态。

### Risks and rollback
真实宿主或 review provider 可能仍不可用；保持不可用事实，不用结构化回放冒充真实执行。B5 不改生产代码，只追加当前质量事实，不做 destructive cleanup。
