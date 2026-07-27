# 处理组 1：基础口径实施计划

## Technical Context

当前问题分布在四个现有接缝：Multica 监控口径、wh-review 路由配置加载、阶段对已处置 review finding 的读取、审查报告投影。实现只修这些接缝，不改 Multica、3rd-review broker、provider/model、fallback、TaskKernel 权限或 metrics。

## Global Constraints

- 不新增依赖、后台服务、同步框架、指标平台或第二套审查状态。
- 监控问题只写可执行规程和验证记录，不修改 WorkflowHub 运行逻辑。
- 当前 route 严格校验、非当前 route warning、doctor 全量严格校验必须复用同一个纯校验函数。
- resolution 只消除已经完整处置且零 accepted risk 的过时暂停；原 verdict 保持不变。
- attempt 分类只存在于报告投影层；原始错误码和原始记录不重写。
- 聚焦测试优先；最终只运行本组覆盖到的完整测试命令，不默认触发整仓全量回归。

## Modules, Interfaces, and Data Contracts

- `docs/multica-monitoring-sop.md`：固化显式 profile、workspace、实际目标与默认 localhost 失败口径。
- `skills/wh-review/scripts/third-review-host-config.mjs`：抽出纯 route 校验；当前 route 返回错误，其他 route 返回 warnings，doctor 对全部错误 fail loud。
- `skills/wh-review/scripts/wh-review-cli.mjs`：在知道 stage/track 后加载当前 route；公开 doctor 入口只消费 host config，不消费 TaskHandle。
- `core/stage-handlers.mjs`：在 serious-review pause 前验证同 flow resolution；复用现有 resolution 读取和最终绑定校验。
- `skills/wh-review/scripts/review-result.mjs`：把 provider attempt 投影为固定分类，保留原码、duration 和 retry count，并把失败 attempt 排除在 finding/质量分母外。
- `core/stage-content-contracts.mjs`、`core/schemas/plan-task-contract.v1.json`：让计划覆盖校验和 canonical schema 同时识别当前已接受规格使用的 `FR-001 / AC-001` 编号；只放宽编号格式，不改变其他字段约束。
- `docs/wh-review-e2e.md`：补源仓、active runner、fresh process 三层证据模板。
- `skills/wh-review/SKILL.md`、`skills/wh-review/manifest.json`、`skills/wh-review/contracts/provider-protocol.md`：同步公开命令、supporting files 和失败分类口径。
- `skills/catalog.yaml`：仅重算现有 wh-review bundle hash。
- 不改变 `wh-review-result.v1`、`wh-review-attempt.v1`、`wh-review-resolution.v1` schema。

## Implementation Order

依赖顺序为：Phase 1 冻结口径和 RED → Phase 2 路由校验 → Phase 3 resolution 暂停修复 → Phase 4 报告投影与三层验证。Phase 2 和 Phase 3 可在 Phase 1 后独立实现；Phase 4 必须在两者完成后做统一聚焦验证。

## Test Strategy

- RED 先覆盖当前 route 错误、非当前 warning、doctor、verified resolution、accepted risk 和 attempt 分类。
- GREEN 后分别运行路由、阶段绑定、报告投影和文档契约测试。
- 最终完整命令固定为：
  `npx vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs tests/official-make-decision-cli.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs tests/stage-plan-task-contract.test.mjs`
- 另运行 `npm run check:skill-closure`、`node scripts/check-constitution.mjs` 和 `git diff --check`。
- 同一 tree 和同一命令已有正式 receipt 时复用，不重复启动全量测试。

## Rollback and Recovery

- 路由重构失败：回退纯校验函数及 CLI 接线，保留新增 RED fixture。
- resolution 修复失败：回退 `core/stage-handlers.mjs`，保留旧 fail-loud 行为，不用风险接受伪装成功。
- 报告投影失败：回退展示函数，不修改任何 canonical attempt/result。
- doctor 或文档改动不能影响正常 review run；若影响则停止，不增加兼容兜底。

## FR to AC to Step Traceability

- FR-001、FR-012 → T001、T002、T010、T012 → AC-001、AC-011。
- FR-002～FR-004 → T003、T004、T005 → AC-002～AC-004、AC-011。
- FR-005～FR-007 → T006、T007 → AC-005、AC-006、AC-011。
- FR-008 → T010 → AC-007、AC-011。
- FR-009～FR-011 → T008、T009 → AC-008～AC-010、AC-011。
- T011 汇总全部 FR/AC 的最终命令和证据。

## Constitution Check

- F1：只解决问题 1、6、10、12。
- F2：复用现有 wh-review、stage handler 和报告接缝。
- F3：Multica 监控与 WorkflowHub core 保持隔离。
- F4：不引入双写、影子结果或兼容状态机。
- F5：没有无来源的产品能力。
- F6：canonical attempt/result/resolution 均不重写。
- F7：不新增人工确认边界。
- F8：自动阶段仍自动推进。
- F9：每项行为都有 RED/GREEN 和失败 oracle。
- F10：review finding 是质量事实，不制造新硬门。
- Q1：报告保留未知和原始错误码。
- Q2：不把 provider 失败伪装成无 finding。
- Q3：最终只做一次独立审查。
- S1：不新增外部依赖。
- S2：不修改 provider/model 配置。
- S3：不复制外部系统实现。
- S4：文档只记录已验证口径。
- S5：配置校验使用一个事实源。
- S6：doctor 复用相同纯函数。
- S7：失败尽早、错误可定位。
- S8：WorkflowHub 可脱离 Multica 独立运行。

## Complexity Trade-offs

选择“一个纯 route 校验函数 + 现有 CLI 内的一个薄 doctor 命令 + 一个报告投影函数 + 现有 resolution 绑定修正”。不选择动态路由管理器、provider 健康探针、metrics bridge、自动部署/同步或新 schema。新增生产文件只有一个监控文档；doctor、报告和 resolution 均原地修改，另补聚焦测试。

## Phase 1：冻结口径与 RED

### Goal

把四类缺口变成可复现失败，不先写生产实现。

### Files

`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`tests/stage-plan-task-contract.test.mjs`。

### Tasks

T001、T003、T006、T008。

### Verify

相关新增断言在旧实现上失败，`gate_cmd` 返回 1，且错误分别指向监控口径、route 校验、stale pause 或 attempt 投影。

### Knowledge

记录旧实现为何错误，不把历史 localhost、旧 verdict 或 provider 失败推断成远端事实。

### STOP

若 RED 不能稳定命中真实路径，停止并缩小 fixture；禁止为通过测试改写需求。

## Phase 2：route 分级校验与 doctor

### Goal

当前 route 严格、其他 route warning、doctor 全量严格，三者共享一个纯校验函数。

### Files

`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/SKILL.md`、`skills/wh-review/manifest.json`、对应测试。

### Tasks

T004、T005。

### Verify

当前 route 非法在 provider 调用前失败；非当前 route 非法继续且输出 warning；doctor 对同一配置退出 1；合法配置退出 0。

### Knowledge

固定相等 priority、重复 profile、跨路径复用、fallback 和空 profiles 的既有语义。

### STOP

若实现需要第二套路由配置或改变 provider 顺序，停止并回到现有 loader 接缝。

## Phase 3：verified resolution 消除过时暂停

### Goal

同 flow、完整处置、零 accepted risk 的 resolution 不再被旧 `revise_required` 重复暂停。

### Files

`core/stage-handlers.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/final-cutover-guards.red.test.mjs`。

### Tasks

T007。

### Verify

正向 attempt 成功且 `missing_items` 为空；缺失、unverified、错 ref/hash/tree/flow、漏 finding、accepted risk 全部 fail loud 或保持 pause。

### Knowledge

resolution 是处置证据，不是新 verdict；最终绑定仍由现有 `bindFinalReview` 校验。

### STOP

若必须修改 result/schema 或放宽跨 flow 校验，停止，不实施。

## Phase 4：报告投影、三层说明与最终验证

### Goal

完成 attempt/finding 分层、失败分类、监控 SOP、三层验证模板和一次最终证据。

### Files

`docs/multica-monitoring-sop.md`、`docs/wh-review-e2e.md`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`core/stage-content-contracts.mjs`、`core/schemas/plan-task-contract.v1.json`、`tests/stage-plan-task-contract.test.mjs`、`skills/catalog.yaml`。

### Tasks

T002、T009、T010、T012、T011。

### Verify

固定分类表、原始码、UNKNOWN warning、duration/retry、质量分母、监控读取和三层字段全部通过；Skill closure、宪法和 diff 检查通过。

### Knowledge

明确失败耗时是公共总耗时，不是纯模型推理时间；缺失字段写“未提供”。

### STOP

若需要 metrics、自动重试、runner 发现或 Multica 代码，停止并删除扩张内容。
