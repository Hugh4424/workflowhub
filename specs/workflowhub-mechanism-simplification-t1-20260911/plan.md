# 实现计划：workflowhub 机制瘦身任务Ⅰ

- **Input**：`specs/workflowhub-mechanism-simplification-t1-20260911/decision-log.md`、`specs/workflowhub-mechanism-simplification-t1-20260911/spec.md`
- **Template version**：`plan-task.v4`

## 材料导航

本表可再生，不是第五份材料。M/S/B/P 表示主会话、子代理、后台执行与并行读取。

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| decision-log.md 第9节、第16.2节及第18节 | 当前决定、来源与最终修正 | M 设计开始；S 对应来源核验 |
| spec.md 第2、4、5、8、9、11节 | 边界、基线、21项需求及验收、记录格式 | M 编写对应方案；S 消费者研究 |
| plan.md 的 Solution Design 与 Phase P1 | 工程方案、单一文件owner、四批即时验证 | M/S 当前批开始；B 独立审查 |
| tasks.md 的 T001–T007 | 精确命令、依赖与唯一完成区 | M/S 执行当前卡；P 仅无共享状态的只读检查 |

## Quick Read

- **Goal**：按 C0 → C1 → C2 → C3 删除无消费者机制、合并真正重复定义、把新任务执行记录收敛到 facts.jsonl；每批结束立即留下可复核观测。
- **Non-goals**：来源：R-016、D-003、D-004、D-012、D-013、D-014、D-015；不改历史字节、不删K1–K9、不建双写/兼容桥/新schema/检查器/公共命令，不改治理正文或五阶段技能，不执行C4–C7。
- **Before**：12个获准叶子、四类重复定义、index/facts与stage-outcomes并存；readTaskFacts缺生产消费者；两处status投影真实读取outcome字节。
- **After**：具名删除证据、单一定义对照表与新记录真实reader闭合；保留K5原始证据，停止派生outcome/index文件写入；历史状态可读且bytes不变。
- **Main risk**：C3涉及原始执行身份与验收引用；不能把旧envelope搬进source/spec_analyze或只删文件后伪造状态。
- **Next step**：T001按开工提交复算并冻结50历史目录；全部实现卡均pending，build-plan未执行任何RED/GREEN。

## Technical Context

### Global Constraints

- **Verified facts**：认证worktree分支为task/workflowhub/workflowhub-mechanism-simplification-t1-20260911；任务原始输入HEAD为`5099522057e2164462d4d47f7ad9fa40e03d59ad`，已在build-code前合入`main`（`5ddf8c4200f5017889ab4d2e8cdaeda85d58d5b9`），当前实现输入基线`INTEGRATION_BASE=762bce755a4de1a21ee09a3bf134cc279af5bccd`；开工测量基准`TASK_BASE=89773aaabf0aad97b64739d32182530f10c32aef`。原始测量与合并后输入分开保存，不把上游合并变化算成本任务净减。
- **Language / runtime**：ES modules，Node >=24；现有依赖ajv 8.17.1、js-yaml 4.1.0；Vitest 2.1.9、markdownlint-cli2 0.14.0。
- **Primary dependencies**：复用node:fs/crypto、Git、现有task-store/TaskHandle/lock/atomic-write；不安装新依赖。
- **Storage / state**：外置task.json保存身份；facts.jsonl为唯一执行记录；K5原始proof/review/test保留。历史index/outcome只能读取，禁止删除或回填。
- **Testing**：C0不跑Vitest；C1/C2用窄合同集；C2保护合并后的两个规划交互合同，C3先五文件seam（含close-contract），再一次14文件兼容集；最后仅一次聚合。禁止npm test/test:safe/无范围Vitest。
- **Target environment**：本地Node/Git工作树与可搬运技能包；non_ui，无浏览器、登录态或截图验收。
- **Scale / scope**：21 FR、21 AC、12获准叶子、四批、冻结50历史目录；58个SHA候选是分类输入，非无差别修改授权。
- **Unresolved facts**：50个历史目录已由用户确认，C0仍需采集原字节基线；唯一归档目录按用户已确认的既有身份错误例外验证，不冒称status通过；M1/M2/token不可得保持缺口；对仓外按路径调用者无法证明零使用，沿用已接受风险。C3原始proof需要窄扩展，现状并非已经足够。

## Code Anchors

- **Verified anchors**：task-store.mjs 的readTaskFacts/appendTaskFact/write路径；quality-store的index写入与事务；task-kernel-implementation的publish/change集合；completion-predicates两个字节投影；stage-runner与stage-agent-outcome-adapter两个outcome writer。
- **Existing interfaces**：`readTaskFacts(taskDir)`真实读取；`withStoreLock`保留锁粒度；`TaskHandle`限制安全读写路径；canonical-evidence-validators负责来源ref/hash认证，freshness负责当前绑定。
- **Read now**：本次冻结输入包与研究证据material-audit.md的C1/C2/C3锚点；研究只作事实，正文决定方案。
- **Must read before task**：T002读每个具名叶子的实际consumer；T004读每条正则及真实producer；T006读新行、raw proof与acceptance绑定三端，不能凭import认定reader。
- **Context mode**：Full，仅跨模块C3；C0/C1/C2按对应锚点Lite读取。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 测量与删除证据 | reuse | Git/rg/Node以及现有测试 | 一次性实跑，不创建复算器或检查器 |
| 共同形状定义 | extend | canonical-utils与canonical-evidence-validators | 同语义调用直接引用；消费者个别绑定条件保留 |
| 唯一执行行 | extend | task-store的read/lock/write | 改原写者，不增加writer/store；旧index无consumer即整删 |
| 原始来源与验收认证 | extend | 现有stage-outcome-proofs、canonical validator/freshness | 保存缺失的原始输入事实，在内存组合；不另存派生envelope |
| 流程/技能/配置控制面 | reuse | 当前五阶段与七公共行为 | 不添加新机制或常驻兼容层 |

## Solution Design

### Overview

四批共享同一组运行时文件，因此采用一个工程Phase，卡片内部严格按批次串行。C0先复算冻结口径并给上游加一行纯指针；C1只删具名无consumer叶子、同批处理测试和必要登记；C2先分类再共享同语义定义；C3迁移写者与真实读取者后删index模块。一个批次未通过时，不执行下一批，也不撤销此前已过批次。`INTEGRATION_BASE`是合并后的实现输入，不改变原任务方向；后续只在实际触碰重叠文件时保留已合入的上游契约。

执行状态唯一当前来源为facts.jsonl。现有K5原始proof仅证明真实输入与执行来源，不成为第二份当前阶段状态。新行source指出原始来源，material_digest绑定材料，review/spec_analyze/evidence/layer_states各自保持本义；当前stage视图由这些字段及原始proof在内存得到，不写新的stage-outcomes派生文件。

### Module responsibilities

| 模块 | 唯一职责 | 消费与产出 | 不得决定 |
| --- | --- | --- | --- |
| task-store | 行解析、选择、原位更新与原子替换 | 读三形状历史/当前；写16键当前行 | 不把missing/unavailable变completed，不补历史字段 |
| canonical-evidence-validators / freshness | ref/hash、来源身份、当前材料匹配 | 新row ref与旧immutable ref分别认证 | 不凭ref存在判质量通过 |
| stage-content-contracts | 阶段内容契约与任务类型/问答边界 | 保留`readTaskTypeFromDecisionLog`及planning question boundary，供close与阶段交互读取 | 不把旧编号式任务身份猜成已知类型；未知仍fail-loud |
| stage-runner / outcome-adapter | 将真实session事件投影到当前行及既有原始proof | 两处writer均停写新outcome；保留合并后的unavailable analyzer输入形状校验 | 不猜session、不复制完整envelope到其它字段 |
| completion-predicates | 从真实readTaskFacts结果派生分层状态 | 两个字节投影都改道 | 不把stage_quality等同交付或物理close |
| reflection / handoff / consumption读者 | 消费当前行及来源proof | 新行路径；旧记录只读分流 | 不通过新增索引恢复旧目录扫描 |
| close writer | 五个真实物理动作各一行 | 真实动作结果与原件ref；保留planning close的4动作及post-cleanup的2动作路径 | 不执行未授权close，不删C7归属对象，不把planning close改成ordinary五动作 |

### Merge reconciliation：上游契约必须保留

本任务是在`INTEGRATION_BASE`上实现，不把main的行为变化当作本任务新需求。实现者触碰重叠文件时必须保留以下已合入契约，并用既有测试做窄保护：

- `readTaskTypeFromDecisionLog`与planning question boundary继续负责任务类型读取和结构化问答边界；当前旧的编号式`## 0. 任务身份`没有类型行时仍是`unknown`，不能在本任务内猜测或改写身份。
- `core/task-close.mjs`的planning close继续使用4动作路径，清理后的post-cleanup路径继续使用2动作；ordinary close的5动作语义不变。
- `stage-runner`对unavailable analyzer结果的形状与失败边界继续有效；不可用仍记录为`unavailable`，不转成完成或通过。

这些是合并前已存在的上游输入和同文件保护条件，不扩大C1–C3的删除、合并或存储范围。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：精确16键及类型编码见DEC-003；不创建schema文件；复用现有parser/validator。新增窄函数只在现有owner模块内，接口/真实consumer和失败行为在卡片动作中绑定。
- **Data flow / state**：真实事件 → 既有K5原始proof → 当前行原子更新 → readTaskFacts → status/acceptance/reflection/handoff。历史25/24键monitoring、旧10键task fact保留只读分支；缺step_slug的24键变体不能误当坏新行。
- **API contract**：N/A — 不新增HTTP API或公共CLI；status/run/review/verify/confirm/authorize/doctor分类不变。
- **UI / external code**：N/A — non_ui；frontend-component-quality、Design.md、Experience.md和浏览器测试不适用，不新增相关文件。
- **Fail-loud behavior**：未知record_kind/额外键/错enum/缺nullable reason/来源hash不符/原子替换失败均抛明确错误；历史缺质量保持unknown，不能写入回填。

## File Boundary

删除证明：本计划采用具名清单与真实consumer证据。12个获准删除叶子见spec第2节及C1表，当前有界来源为`quality/evidence/build-plan/material-audit.md`和原决定；完整导出候选三条件、动态/发布入口与混合测试保留范围见T002及独立manual条件。C1实施时逐项复核并保留原始输出，证据不足即保留对象；当前证明是删除边界与证据设计，不声称未来删除/测试已执行。

### NEW

N/A — 不新增生产文件、测试文件、schema或检查器。任务原始输出只进入既有quality/evidence，非第五份材料。

### MODIFY

- `core/__tests__/capability-doctor.test.mjs`
- `core/__tests__/task-index.test.mjs`
- `core/task-close.mjs`
- `docs/architecture/deletion-plan.json`
- `docs/architecture/move-map.json`
- `runtime/distribution/runner-release.mjs`
- `runtime/distribution/skill-bundle-release.mjs`
- `runtime/evidence/acceptance-evidence-validator.mjs`
- `runtime/evidence/audit-summary-carrier.mjs`
- `runtime/evidence/boundary-confirm.mjs`
- `runtime/evidence/canonical-evidence-validators.mjs`
- `runtime/evidence/canonical-receipt-writer.mjs`
- `runtime/evidence/canonical-utils.mjs`
- `runtime/evidence/capability-doctor.mjs`
- `runtime/evidence/check-skill-closure.mjs`
- `runtime/evidence/dsh-transcript.mjs`
- `runtime/evidence/fact-collector.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/evidence/journal-schema.mjs`
- `runtime/evidence/quality-fact.mjs`
- `runtime/evidence/quality-store.mjs`
- `runtime/evidence/receipt-schema.mjs`
- `runtime/evidence/requirement-ledger.mjs`
- `runtime/evidence/research-report.mjs`
- `runtime/evidence/storage-root.mjs`
- `runtime/evidence/stage-completion-facts.mjs`
- `runtime/evidence/stage-content-evidence.mjs`
- `runtime/evidence/text-utils.mjs`
- `runtime/evidence/workflow-evolution.mjs`
- `runtime/evidence/write-boundary-preflight.mjs`
- `runtime/review/integration-review-subject.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/review/stage-review-disposition.mjs`
- `runtime/schemas/stage-reflection.v2.json`
- `runtime/stage/completion-predicates.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-handoff.mjs`
- `runtime/stage/stage-reflect.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/task/git-worktree-snapshot.mjs`
- `runtime/task/material-workspace.mjs`
- `runtime/task/task-handle.mjs`
- `runtime/task/task-index.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/task/task-store.mjs`
- `skills/catalog.yaml`
- `skills/mini-task/scripts/mini-task-runner.mjs`
- `skills/mini-task/skill-bundle.json`
- `skills/wh-review/scripts/ac-evidence-summary.mjs`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `skills/wh-review/scripts/simple-review-runner.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/skill-bundle.json`
- `specs/workflowhub-mechanism-simplification-20260910/prd.md`
- `tests/boundary-confirm.test.mjs`
- `tests/build-code-target.test.mjs`
- `tests/contract/check-skill-updates.test.mjs`
- `tests/contract/core-runtime-layering.test.mjs`
- `tests/contract/derive-consumption-edges.test.mjs`
- `tests/contract/execution-outcome.test.mjs`
- `tests/contract/generate-iteration-brief.test.mjs`
- `tests/contract/protocol-error-trace.test.mjs`
- `tests/contract/repo-skills-manifest.test.mjs`
- `tests/contract/research-report.test.mjs`
- `tests/contract/stage-handoff.test.mjs`
- `tests/contract/stage-reflection-e2e-constructed.test.mjs`
- `tests/contract/stage-reflection-paths.test.mjs`
- `tests/contract/status-derivation.test.mjs`
- `tests/contract/verify-publication.test.mjs`
- `tests/contract/workflow-evolution-governance.test.mjs`
- `tests/contract/workflow-evolution-ledgers.test.mjs`
- `tests/dsh-transcript.test.mjs`
- `tests/integration/distribution-closure.test.mjs`
- `tests/integration/minimal-task-storage.test.mjs`
- `tests/integration/task-fact-index-consistency.test.mjs`
- `tests/integration/verify-freshness-selection.test.mjs`
- `tests/integration/vnext-delivery-close.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/requirement-lineage.test.mjs`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `tests/stage-plan-task-contract.test.mjs`
- `tests/task-record-paths-check.test.mjs`
- `tests/verify-code-facts.test.mjs`
- `tools/architecture/clean-install.mjs`
- `tools/architecture/complexity-report.mjs`
- `tools/architecture/inventory.mjs`
- `tools/architecture/public-behavior-baseline.mjs`
- `tools/architecture/verify-final-coverage.mjs`
- `tools/cli/build-reflection-page.mjs`
- `tools/cli/check-skill-updates.mjs`
- `tools/cli/check-task-record-paths.mjs`
- `tools/cli/derive-consumption-edges.mjs`
- `tools/cli/generate-iteration-brief.mjs`
- `tools/cli/measure-test-runtime-profile.mjs`
- `tools/cli/produce-final-current-snapshot.mjs`
- `tools/cli/record-evolution-result.mjs`
- `tools/cli/repo-skills-manifest.mjs`
- `tools/cli/smoke-local-skill-dispatch.mjs`
- `tools/cli/task-close.mjs`
- `tools/cli/validate-current-plan-tasks.mjs`
- `tools/host/workflowhub-stage-agent-bridge.mjs`
- `workflows/verify-code/design-alignment.mjs`

具名整删只限T002的12叶子与其独占测试、T006的task-index及独占测试。候选不等于删除许可；其它文件均限对应符号/登记。C2精确表覆盖44个无flag与4个/i生产文件，各自合并到一个常量；5个测试oracle保留，5个C1退场对象不重复修改。可搬运包已直接依赖runtime，须验证现有发布闭包携带共享owner。

### DO NOT TOUCH

- `specs/workflowhub-mechanism-simplification-t1-20260911/decision-log.md`：已确认方向；本阶段不改。
- `specs/workflowhub-mechanism-simplification-t1-20260911/spec.md`：产品语义及验收；源导航的同task owner修复已独立留证，后续实现不改。
- `docs/adr/0030-mechanism-simplification-deletion-boundary.md`：已交付删除边界ADR，保留原文件。
- `CONSTITUTION.md`、`constitution-checklist.md`、`AGENTS.md`、`CONTEXT.md`、`docs/standard-workflow.md`：治理正文不在删除同步范围。
- `runtime/stage/protocol-error-whitelist.mjs`：活分类白名单不删不改。
- `runtime/schemas/audit-summary.schema.json`、`runtime/schemas/human-confirmation.v1.schema.json`、`runtime/schemas/quality-verify.v1.json`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/risk-acceptance.v1.json`、`runtime/schemas/source-manifest.schema.json`、`runtime/schemas/steps.schema.json`、`runtime/schemas/task-fact.v1.json`、`runtime/schemas/task-index.v1.json`、`tools/cli/source-manifest.mjs`：Tier C保留。

全部历史task目录及K1–K9原件为只读集合，T001冻结精确路径/hash后逐项核对。未列NEW/MODIFY的任何路径一律不改；本表无需复制外置历史路径成为新权威清单。

## Technical Decisions

### DEC-001 — 一个Phase拥有共享文件，四批仍串行

- **Problem**：C1/C3共用守卫与测试，C2/C3共用reader/validator。
- **Options**：每批独立Phase会出现同文件多owner；一个Phase下串行批次可维持唯一owner。
- **Selected**：reuse — 一个Phase、四批、七卡，C0/C1非行为清理，C2/C3各RED/GREEN，T007最终受影响并集及聚合。
- **Reason**：不改变D-002/D-009的顺序和即时验证；省去重复控制层。
- **Consequence / risk**：不得因为同Phase就把四批验证拖到末尾；T001–T006的批次证据强制区分。
- **Fallback**：当前批失败停该批，不回退已过批。

### DEC-002 — 同语义公共定义，消费者继续负责身份

- **Problem**：重复正则/形状校验存在接受集差异，直接取交集会拒绝真实输出。
- **Options**：大一统validator会吞业务检查；复制各处继续漂移；只提取共同形状最小。
- **Selected**：extend — canonical-utils中的SHA256_HEX；canonical-evidence-validators中的反射ref与outcome形状；CLOSE_PLAN_REF沿现有窄owner导出。
- **Reason**：比较表达式、flags、真实producer和消费者约束，确认同义才引用同处。
- **Consequence / risk**：无flag与/i分别一个唯一定义；测试反例保留独立oracle，40位/路径内嵌/前缀模式确属不同语义，逐处解释保留；不能写泛称“业务不同”逃避重复定义合并。
- **Fallback**：真实producer接受集不闭合则停C2，保留原定义与分类事实。

### SHA逐处分类与保守导出扫描

SHA计数单位已复核：58是文件数，110是匹配行和字面量出现次数；不与文件数相减推断遗漏。固定扫描命令：`rg -n '\^\[a-f0-9\]\{64\}\$' core runtime tools skills scripts workflows metrics --glob '*.mjs' --glob '!**/node_modules/**'`。下表是当前四材料内的工程输入；原只读扫描证据仍保留，不要求执行者自行寻找未送审材料。

| 类别 | 文件数 | 匹配行数 | 正则字面量出现次数 |
| --- | --- | --- | --- |
| 存活无flag生产 | 44 | 91 | 91 |
| 存活i生产 | 4 | 4 | 4 |
| 独立测试oracle | 5 | 6 | 6 |
| C1退出 | 5 | 9 | 9 |

旧110与本轮若不同，应标为实测漂移或历史命令差异，不能强行修数。精确逐文件映射：

| 文件 | 类别 | 行数 | 出现次数 |
| --- | --- | --- | --- |
| `core/__tests__/invocation-identity.test.mjs` | 独立测试oracle | 2 | 2 |
| `core/__tests__/local-skill-resolver.test.mjs` | 独立测试oracle | 1 | 1 |
| `core/__tests__/stage-skill-runtime.test.mjs` | 独立测试oracle | 1 | 1 |
| `core/task-close.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/distribution/runner-release.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/distribution/skill-bundle-release.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/acceptance-evidence-validator.mjs` | 存活无flag生产 | 3 | 3 |
| `runtime/evidence/audit-summary-carrier.mjs` | C1退出 | 2 | 2 |
| `runtime/evidence/canonical-evidence-validators.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/canonical-receipt-writer.mjs` | 存活无flag生产 | 8 | 8 |
| `runtime/evidence/check-skill-closure.mjs` | 存活i生产 | 1 | 1 |
| `runtime/evidence/dsh-transcript.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/fact-collector.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/freshness.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/quality-fact.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/quality-store.mjs` | 存活无flag生产 | 2 | 2 |
| `runtime/evidence/research-report.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/stage-completion-facts.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/stage-content-evidence.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/evidence/workflow-evolution.mjs` | 存活无flag生产 | 6 | 6 |
| `runtime/evidence/write-boundary-preflight.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/review/integration-review-subject.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/review/review-record-route.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/review/stage-review-disposition.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/stage/completion-predicates.mjs` | 存活无flag生产 | 2 | 2 |
| `runtime/stage/stage-agent-outcome-adapter.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/stage/stage-content-contracts.mjs` | 存活无flag生产 | 3 | 3 |
| `runtime/stage/stage-handlers.mjs` | 存活无flag生产 | 2 | 2 |
| `runtime/stage/stage-handoff.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/stage/stage-reflect.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/stage/stage-runner.mjs` | 存活无flag生产 | 8 | 8 |
| `runtime/task/git-worktree-snapshot.mjs` | 存活无flag生产 | 2 | 2 |
| `runtime/task/material-workspace.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/task/task-kernel-implementation.mjs` | 存活无flag生产 | 1 | 1 |
| `runtime/task/task-store.mjs` | 存活无flag生产 | 1 | 1 |
| `skills/mini-task/scripts/mini-task-runner.mjs` | 存活无flag生产 | 1 | 1 |
| `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` | 独立测试oracle | 1 | 1 |
| `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs` | 独立测试oracle | 1 | 1 |
| `skills/wh-review/scripts/ac-evidence-summary.mjs` | 存活无flag生产 | 1 | 1 |
| `skills/wh-review/scripts/review-provider-client.mjs` | 存活i生产 | 1 | 1 |
| `skills/wh-review/scripts/simple-review-runner.mjs` | 存活无flag生产 | 3 | 3 |
| `skills/wh-review/scripts/third-review-host-config.mjs` | 存活无flag生产 | 2 | 2 |
| `skills/wh-review/scripts/wh-review-cli.mjs` | 存活无flag生产 | 8 | 8 |
| `tools/architecture/clean-install.mjs` | 存活无flag生产 | 1 | 1 |
| `tools/architecture/complexity-report.mjs` | 存活无flag生产 | 4 | 4 |
| `tools/architecture/inventory.mjs` | 存活无flag生产 | 1 | 1 |
| `tools/architecture/public-behavior-baseline.mjs` | 存活无flag生产 | 1 | 1 |
| `tools/architecture/verify-final-coverage.mjs` | 存活无flag生产 | 8 | 8 |
| `tools/cli/check-skill-updates.mjs` | C1退出 | 1 | 1 |
| `tools/cli/generate-iteration-brief.mjs` | C1退出 | 4 | 4 |
| `tools/cli/measure-test-runtime-profile.mjs` | 存活i生产 | 1 | 1 |
| `tools/cli/produce-final-current-snapshot.mjs` | 存活i生产 | 1 | 1 |
| `tools/cli/record-evolution-result.mjs` | C1退出 | 1 | 1 |
| `tools/cli/smoke-local-skill-dispatch.mjs` | 存活无flag生产 | 1 | 1 |
| `tools/cli/task-close.mjs` | 存活无flag生产 | 1 | 1 |
| `tools/cli/validate-current-plan-tasks.mjs` | C1退出 | 1 | 1 |
| `tools/host/workflowhub-stage-agent-bridge.mjs` | 存活无flag生产 | 1 | 1 |
| `workflows/verify-code/design-alignment.mjs` | 存活无flag生产 | 1 | 1 |

D-006导出扫描是独立于12文件整删名单的符号清理。用`rg --files -g '*.mjs' -g '*.js' -g '*.cjs' -g '*.ts' -g '!**/node_modules/**'`取生产候选、全部代码作consumer集合；先剔除测试/fixture定义，再逐项查直接声明、export-from、namespace、动态键/模块路径、发布入口和生成代码。历史129/41/20是旧方法候选量；本轮直接声明初筛154（455代码文件、evidence38）不含export-list，不能强比或说净增25。每个候选必须有remove/keep及源码锚点；未证动态访问不存在就保留。当前仅两处具名等价清理：storage-root.mjs的workflowHubConfigPath和canonical-receipt-writer.mjs的TEST_CAPTURE_TIMEOUT_MS取消export，保留定义与内部调用。现有storage-root测试和test-runtime-profile的真实receipt单案例验证存活行为；整文件删除仍只限12条。

local_bundle_hash只覆盖skill-bundle.files内字节，不覆盖传递runtime。C2改两包内脚本后重算相应sha/catalog；C3只改runtime时不机械重写两包hash。T007最终运行发行闭包测试；若又改包内脚本，按实际字节重算，而非因为runtime有变化就重算。

### DEC-003 — 16键当前行与既有原始证据分工

- **Problem**：现proof仅12键，缺部分run/manifest/生命周期事实；直接把source指向旧proof不足以替换outcome。
- **Options**：新增第17键或隐藏全envelope违背规格；丢执行来源违背K5/F9；复用既有proof保存原始缺项，再从当前行读取。
- **Selected**：extend — 顶层键不变，source只描述来源及具名proof；material_digest仅描述材料/manifest摘要；proof补原始事件字段，不存派生stage outcome。
- **Reason**：必要消费输入只保留一处原始来源，在内存按现有公式派生当前视图；不新增对象类别/目录/公共命令。
- **Consequence / risk**：嵌套编码必须经当前spec语义核对和独立review；任何项若只能靠塞完整envelope或新增持久索引实现，C3停并返回build-spec。
- **Fallback**：保留历史只读分流；不回填历史proof；新输入缺项真实unavailable，不回退扩键或双写。

| 顶层字段 | 工程编码与唯一内容 | 真实consumer |
| --- | --- | --- |
| record_kind / task_id / stage | string；stage或close_action；close动作stage固定close | task-store判别与唯一键选择 |
| source | 来源描述对象：producer、attempt_id、run_id、proof_refs；只标识来源，不承载steps/skills结果 | canonical认证、completion-predicates选择当前来源 |
| created_at | 当前行值写入时刻ISO字符串，更新时改变 | 当前行读者展示；不作为身份替代 |
| material_digest | 对象：material_revision、material_hashes、material_scope、material_scope_revision、material_scope_hashes、steps_manifest_ref/hash、skills_manifest_ref/hash；内容均为来源摘要绑定 | freshness、stage-runner、acceptance认证 |
| snapshot_tree | 已认证40位snapshot标识或nullable wrapper | 源proof与当前snapshot比较 |
| review_origin / review_result_ref | 五个冻结机器值；conducted指向实际审查原件，其余nullable | review/quality投影 |
| finding_dispositions | 数组元素为finding_id、disposition；保留四处置值 | 严重问题处置与review消费 |
| spec_analyze | 该阶段分析结果及具名原件引用；不装执行数组 | 阶段一致性消费 |
| evidence | 数组元素为command、exit_code整数、failure_signature；原输出经既有proof引用保留 | 执行事实与验收消费者 |
| layer_states | implementation_completion、stage_quality、delivery、task_closure独立取completed/unavailable/incomplete/partial | status分别展示，禁止层级互推 |
| serious_issue_disposition | 现有严重finding处置字段或nullable | 正式完成描述 |
| close_action | stage行nullable；close行action、result、ref，五物理动作各一行 | close动作读取者 |
| handoff | 三个具名交接项：id、owner、trigger、consumer、close_condition | C5/C4/宿主的当前记录读取 |

nullable统一为`{"value":null,"reason":"具名真实原因"}`；不用缺键表达不适用。source/material_digest的对象子键仅是规格身份/材料组的工程编码，不授予新语义。nested raw proof变化由既有producer/validator消费，不新建schema文件。

原始proof每个subject补保留真实host事件中的input_refs/output_refs/reason、skill trigger/executed/version/consumer_binding/cost；run/material/manifest绑定由现有caller在当次执行捕获，不能伪称host已提供。direct runner的publishFailureStageOutcome复用adapter既有protocol/lifecycle proof owner，不另建failure模型。未完成且零输出的subject也保留原始不可得原因；不能由当前manifest或当前文件重新捏造执行时内容。整体状态/步骤order由已绑定manifest和真实事件派生，不能由layer_states反推完成。

新引用设计为`facts.jsonl#stage/<stage>`，close引用为`facts.jsonl#close_action/<action>`。既有ref读取owner明确解析片段，按唯一键选row，hash针对规范化row bytes而不是整文件；其它stage更新不误伤本stage，当前stage更新使旧row hash失配，旧验收原件只保留并显示stale。对旧`quality/evidence/stage-outcomes/...`引用继续只读认证原bytes；不扫描latest替换绑定。TaskHandle的readRecord/readRecordBytes对严格行ref返回同一规范化row字节，recordPath仍只返回物理路径；task-kernel的ref与stage-runner的readEvidence/readSkillEvidence同步支持行ref。canonical-receipt-writer的verification/replay/aggregate嵌套ref与acceptance-evidence-validator都走同一认证；freshness的新ref分支必须继续做nested stage/AC/attempt/material认证，不能只放宽namespace后绕过。stage-reflection.v2现有safe_ref只增加严格行ref分支；代码路径SAFE_PATH维持原规则。缺row、重复row、截断、wrong task/stage/attempt/material/hash均fail-loud。

### DEC-004 — 预算化验证和真正净减

- **Problem**：反复跑整套和仅统计文件数会制造成本并掩盖错误。
- **Options**：一次全量回归无法归因；逐文件无休止重复会浪费；每批seam+兼容预算+末次聚合覆盖真实风险。
- **Selected**：reuse — 已有Vitest、Node命令、Git diff和原始quality证据，未增加检查器。
- **Reason**：命令输出、失败签名、raw ref和当前snapshot相互绑定；净减只认实际diff，至少task-index整删30行。
- **Consequence / risk**：既有三红继续红并不等于新测试GREEN；分别报告baseline不增和针对性新断言结果。
- **Fallback**：命令超预算保留部分输出与实际exit，回具体失败卡，不能换宽松命令。

## Test Strategy

所有测试为设计，build-plan不执行。证据放task-relative quality/evidence/implementation；RED/GREEN同command与oracle、原始输出各自保留。每批测试前后记录snapshot、started/verified/finished时刻与command fingerprint。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AC-MS-001, AC-MS-013, AC-MS-017, AC-MS-018 | T001 | N/A | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C0` / 0 | ORACLE-C0 / `quality/evidence/implementation/C0` |
| AC-MS-002, AC-MS-003, AC-MS-004, AC-MS-015, AC-MS-019 | T002 | N/A | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C1` / 0 | ORACLE-C1 / `quality/evidence/implementation/C1` |
| AC-MS-005, AC-MS-006 | T003 | RED | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C2` / 1 | ORACLE-C2 / `quality/evidence/implementation/C2/T003` |
| AC-MS-005, AC-MS-006 | T004 | GREEN | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C2` / 0 | ORACLE-C2 / `quality/evidence/implementation/C2/T004` |
| AC-MS-007, AC-MS-008, AC-MS-009, AC-MS-010, AC-MS-011, AC-MS-014, AC-MS-016, AC-MS-020 | T005 | RED | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C3` / 1 | ORACLE-C3 / `quality/evidence/implementation/C3/T005` |
| AC-MS-007, AC-MS-008, AC-MS-009, AC-MS-010, AC-MS-011, AC-MS-014, AC-MS-016, AC-MS-020 | T006 | GREEN | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C3` / 0 | ORACLE-C3 / `quality/evidence/implementation/C3/T006` |
| AC-MS-001, AC-MS-002, AC-MS-003, AC-MS-004, AC-MS-005, AC-MS-006, AC-MS-007, AC-MS-008, AC-MS-009, AC-MS-010, AC-MS-011, AC-MS-012, AC-MS-013, AC-MS-014, AC-MS-015, AC-MS-016, AC-MS-017, AC-MS-018, AC-MS-019, AC-MS-020, AC-MS-021 | T007 | N/A | `node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' FINAL` / 0 | ORACLE-FINAL / `quality/evidence/implementation/FINAL` |

T006完成五文件seam后，本批一次兼容命令为：`npx --no-install vitest run tests/integration/task-fact-index-consistency.test.mjs tests/integration/minimal-task-storage.test.mjs tests/contract/protocol-error-trace.test.mjs tests/contract/verify-publication.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/contract/status-derivation.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/execution-outcome.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-reflection-e2e-constructed.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/dsh-transcript.test.mjs tests/contract/research-report.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`。C1已退场requirement-lineage与C3退场task-index.test不再列入，保留其原删除/失败证据；其它14文件不能为了变绿删断言。C2另以现有`tests/contract/decision-convergence-depth.test.mjs`和`tests/contract/stage-interaction-batching.test.mjs`保护main已合入的任务类型/问答边界；C3 seam另以现有`tests/close/close-contract.test.mjs`保护planning close的4动作、post-cleanup的2动作和ordinary close的5动作。仅保护既有合并行为，不新增测试文件或产品范围。

C1与最终并集仅排除`TaskContext static guard > passes the migrated repository contract`这一既有全仓守卫断言，原断言不删除不放宽。理由：它要求全仓exit=0，与已批准路径守卫10条基线并非同一oracle；同轮独立运行完整路径守卫、核对全部失败签名与计数不增。该排除须记录为known-baseline，不把跳过说成通过；其它fixture/新增C1断言全部执行。

三个已知红的确切命令为`npx --no-install markdownlint-cli2 "**/*.md"`、`node tools/cli/check-task-record-paths.mjs`、`node tools/cli/verify-structure.mjs`。这是AC-MS-013要求的有明确范围检查，不是全量Vitest例外。统计error与文件数、FAIL签名，分别不超过612/35、10、2；四份当前材料用显式四路径检查必须0。既有红结果原样保留，不用它替代C1/C2/C3新增行为测试结果。

| 风险维度 | 设计场景与oracle | fixture/service与限制 |
| --- | --- | --- |
| 行为/数据 | 两行型、16键、同stage更新、五close动作；精确值比较 | 临时新task；不执行真实close/外部provider |
| 错误/恢复 | 缺source、hash错、未知enum、非法JSON、写入/rename失败 | fs错误注入；保留旧bytes，不吞异常 |
| 并发/原子性 | 不同stage竞争不丢行；同stage序列化原子替换 | 复用withStoreLock；单机文件系统，网络fs不覆盖 |
| 权限/来源 | TaskHandle路径、原始proof认证、跨task/ref拒绝 | 路径穿越与旧验收hash负例 |
| 跨模块seam | writer→readTaskFacts→status/acceptance→reflection/handoff | 两个status字节投影和所有目录扫描consumer都覆盖 |
| 历史兼容 | 冻结50目录解析、49实际status及1具名身份错误、三形状解析、前后清单/hash一致 | 只读真实历史，不init、不修复历史、不复跑任务 |
| UI/可访问性 | N/A — non_ui，无页面/浏览器变化 | frontend-testing/frontend-component-quality不适用 |

每批成功时，由tasks.md内的本任务精确命令写`quality/evidence/implementation/C0/observations.json`、`C1/observations.json`、`C2/observations.json`、`C3/observations.json`各一份；T001/T002/T004/T006分别是唯一producer，T007是唯一consumer。原始stdout/stderr与真实command/argv/cwd/exit/start/end保留在对应`run-<uuid>/`；失败只写该次失败record，不写成功observations。成功原件采用wx，禁止覆盖；若确需重跑已成功批次，先记录新原因与独立证据引用，不能静默替换旧原件。RED仍仅产生失败原件，C2/C3同一精确命令仅在预定具名AssertionError后返回1；加载/缺title/环境失败返回2；在新行为断言失败后立即退出，GREEN才继续闭包/兼容/历史检查。

T007不读取摘要中的expected/actual，更不以两个自填值相等判AC通过。AC001/002/003/015及批内时序AC012/021必须同时消费tasks精确列出的独立manual条件原件、原工具输出与源码锚点；缺任一条件或来源返回2且不输出成功entries，不能以自动子集冒充整AC。固定预期来自本任务冻结值与具名测试清单；actual来自原stdout重新解析、当前文件/原blob比较和Vitest JSON的精确fullName/status。T007在最终快照运行一次明确受影响并集、一次真实receipt具名单例、三红及四材料lint，重新计算当前源码/历史bytes；49历史status及1具名身份错误只在C3本批运行一次，且launcher实际解析目录必须等于冻结目录，FINAL验证其真实命令原件和原集合，不能重新补造过去时间。分类类manual证据仍要按每AC源码锚点及独立审查处置核对，命令输出不替代人工语义核查，也不把缺失输入自动变成passed。

M5与三红基线使用任务开工提交`TASK_BASE=89773aaabf0aad97b64739d32182530f10c32aef`的隔离只读视图；实施保护、上游指针、ADR字节比较以及实现前的当前树检查使用合并提交`INTEGRATION_BASE=762bce755a4de1a21ee09a3bf134cc279af5bccd`。合并后的当前M5预期为`7124/35/1525/232/16`，只作为实现输入基线，不替换AC-MS-001要求的原始`7014/35/1525/231/16`。M4 task-owned diff从`INTEGRATION_BASE`计算到交付提交；`TASK_BASE→INTEGRATION_BASE`单独记录为上游变化，不计入本任务净减。两组基线不得混用。

用户已真实回复“采用，继续吧”（decision-log §18）：历史只读集合固定为已绑定现场枚举中排除本任务后的50个其他目录。C0从quality/evidence/build-plan/historical-selection-clarification-001.json及其原枚举ref/hash生成history-selection.json，并保存实际bytes基线；C3与FINAL消费同一精确集合。不得任挑目录、按mtime推算或重枚举替换；本任务不受历史bytes不变断言，其新writer→真实reader→status由AC-MS-008/011的既有生产路径测试单独验证。 历史路径等价按stat dev/ino证明同一文件系统目录，允许macOS同目录的大小写表示差异；不能凭字符串大小写误判4个目录为缺失。归档目录身份冲突已由用户采纳既有错误例外：49个有效任务status零抛错，唯一具名目录保存真实身份拒绝且只读解析；50目录全部保护bytes，不排除目录、不放宽认证。原51条测量事实保留，口径答复不代替最终计划验收。

## Rollback and Recovery

- **Global recovery rule**：只回滚当前未通过批次的本次实现；保留已过批次、四材料、所有原始review/test/proof和失败证据。历史文件永不写回。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup仅在用户另行授权后执行；本计划不执行交付动作。
- **Recovery owner**：build-code当前执行者定位命令/数据错误；工程边界回plan，规格语义回build-spec，方向回make-decision；不整阶段重跑。
- **当前批回滚操作**：T001/T002/T003/T005动手前，在该批现有`quality/evidence/implementation/<batch>/before/`保存本批具名文件的原始bytes与mode，记录每个相对路径的存在性及sha256；T003/T004共享C2起点，T005/T006共享C3起点。这样C3的before已经包含通过的C2修改。失败后立即保存本批当前after bytes/hash与`git diff --no-index before/<path> after/<path>`原始补丁（差异exit=1是正常输出，不冒充测试失败）。恢复前逐文件核对worktree hash仍等于本批after；有他人修改或hash不符就停并协调，不能覆盖。仅对本批清单执行：before存在则按原mode还原原bytes；before不存在且当前hash属于本批新增产物才删除。恢复后逐项核对worktree hash/mode等于before，并核对前批已过文件的hash仍为前批末值。不得用`git reset/checkout HEAD`恢复共享文件，不动历史任务、四材料或证据原件；这些before/after/patch仅是本次证据，没有许可、阶段状态或运行时消费者。

### Engineering Risk Handoff

- **Affected IDs**：FR-MS-007–FR-MS-011、FR-MS-020、AC-MS-007–AC-MS-011、AC-MS-020、T005、T006。
- **Trigger**：proof缺源字段、ref解析不兼容、历史status抛错、索引生产读写仍有命中。
- **Consequence**：当前行显示完成但验收缺身份，或旧任务不可读，均不能宣称完成。
- **Mitigation or STOP**：按DEC-003逐字段producer→reader表核验；proof仅补真实raw字段；不能无损映射则停C3并回build-spec，禁止扩第17键或写兼容历史。
- **Handling Stage**：build-plan完成工程设计；build-code实跑；verify-code独立核对当前消费链。
- **Verification**：T005/T006相同seam断言、14文件兼容、49历史status及1具名身份错误+hash、旧ref失效负例；缺任何真实结果保持incomplete。
- **当前任务实例读回**：C3真实文件系统fixture验证writer/readTaskFacts/状态投影代码，不能冒充当前task root实测。正常build-code正式run完成后，执行tasks T007登记的现有只读status与readTaskFacts命令，核对本task新stage行/source ref与hash/material_digest/实际snapshot及status所消费的行。该后置读回不作为T007或同次未来outcome的前置，不形成自循环；未读回保持pending/unavailable，不能声称当前实例通过。

| 已有风险 | 处理与验证 |
| --- | --- |
| RISK-001 仓外CLI消费者不可证明 | 沿用已接受风险，叶子恢复只依赖Git历史，不新增兼容桥 |
| RISK-003 上游指针冲突 | 仅一行，不复制内容；冲突只解决指针行，未获授权不合并 |
| RISK-004 接受集取交集 | C2先以producer输出分类，含verify-code与legacy合法形态 |
| RISK-005 旧宿主不可得 | 旧事实只作来源，不推断当前bridge；实际不可得才写unavailable |
| RISK-006 合并后基线漂移 | 已完成的main合并固定为`INTEGRATION_BASE`；交付前重新核对该基线及当前main，不自动吸收后续main变化；`TASK_BASE`只用于原始M5/三红对照 |
| RISK-007 预锚定审查 | 当前送审原始需求+spec+plan+tasks，原始provider输出保留，不以旧阴性结论代替 |

## Implementation Order

P1 内部执行顺序：C0/T001 → C1/T002 → C2/T003 RED → C2/T004 GREEN → C3/T005 RED → C3/T006 GREEN → T007 FINAL。每个箭头是前批观测结果或本行为RED事实的生产者到消费者；四批不可并行或跳过。

## Dependencies and Parallelism

- **Dependencies**：C1消费C0口径与历史目录冻结；C2消费C1剩余文件；C3消费C2共同形状定义并再次使用共享文件；FINAL消费四批真实观测。
- **Parallel work**：N/A — 所有写卡串行；只读consumer核验可独立委派，主会话汇总，不能多个agent改同文件。
- **External dependencies**：既有异源wh-review broker；unavailable保留原错误与canonical attempt，不记pass、不制造替代provider。

## Requirement and Verification Traceability

这是唯一source → FR → AC → task → oracle映射。每张卡只引用此表的ID与精确文件，不复制产品理由。

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-007 R-016 D-010 D-011 | FR-MS-001 | AC-MS-001 | P1 / T001 | none | `specs/workflowhub-mechanism-simplification-20260910/prd.md` | ORACLE-C0；命令见同ID测试策略行 |
| R-008 R-016 D-003 | FR-MS-002 | AC-MS-002 | P1 / T002 | T001 | `core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs` | ORACLE-C1；命令见同ID测试策略行 |
| R-008 R-016 D-006 | FR-MS-003 | AC-MS-003 | P1 / T002 | T001 | `core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs` | ORACLE-C1；命令见同ID测试策略行 |
| R-008 R-016 D-013 | FR-MS-004 | AC-MS-004 | P1 / T002 | T001 | `core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs` | ORACLE-C1；命令见同ID测试策略行 |
| R-009 R-016 D-005 | FR-MS-005 | AC-MS-005 | P1 / T003, T004 | T002 | `core/task-close.mjs`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/canonical-utils.mjs`, `runtime/evidence/check-skill-closure.mjs`, `runtime/evidence/dsh-transcript.mjs`, `runtime/evidence/fact-collector.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-fact.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/research-report.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/evidence/write-boundary-preflight.mjs`, `runtime/review/integration-review-subject.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/stage-review-disposition.mjs`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/git-worktree-snapshot.mjs`, `runtime/task/material-workspace.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `skills/catalog.yaml`, `skills/mini-task/scripts/mini-task-runner.mjs`, `skills/mini-task/skill-bundle.json`, `skills/wh-review/scripts/ac-evidence-summary.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/skill-bundle.json`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tools/architecture/clean-install.mjs`, `tools/architecture/complexity-report.mjs`, `tools/architecture/inventory.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/verify-final-coverage.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `tools/cli/smoke-local-skill-dispatch.mjs`, `tools/cli/task-close.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `workflows/verify-code/design-alignment.mjs` | ORACLE-C2, ORACLE-C2；命令见同ID测试策略行 |
| R-009 R-016 D-007 | FR-MS-006 | AC-MS-006 | P1 / T003, T004 | T002 | `core/task-close.mjs`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/canonical-utils.mjs`, `runtime/evidence/check-skill-closure.mjs`, `runtime/evidence/dsh-transcript.mjs`, `runtime/evidence/fact-collector.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-fact.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/research-report.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/evidence/write-boundary-preflight.mjs`, `runtime/review/integration-review-subject.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/stage-review-disposition.mjs`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/git-worktree-snapshot.mjs`, `runtime/task/material-workspace.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `skills/catalog.yaml`, `skills/mini-task/scripts/mini-task-runner.mjs`, `skills/mini-task/skill-bundle.json`, `skills/wh-review/scripts/ac-evidence-summary.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/skill-bundle.json`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tools/architecture/clean-install.mjs`, `tools/architecture/complexity-report.mjs`, `tools/architecture/inventory.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/verify-final-coverage.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `tools/cli/smoke-local-skill-dispatch.mjs`, `tools/cli/task-close.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `workflows/verify-code/design-alignment.mjs` | ORACLE-C2, ORACLE-C2；命令见同ID测试策略行 |
| R-010 R-016 D-008 | FR-MS-007 | AC-MS-007 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-010 R-016 D-008 D-015 | FR-MS-008 | AC-MS-008 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-010 R-016 D-008 | FR-MS-009 | AC-MS-009 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-010 R-016 D-015 | FR-MS-010 | AC-MS-010 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-010 R-016 D-005 | FR-MS-011 | AC-MS-011 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-005 R-006 R-016 D-002 D-009 | FR-MS-012 | AC-MS-012 | P1 / T007 | T006 | `tests/contract/status-derivation.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs` | ORACLE-FINAL；命令见同ID测试策略行 |
| R-014 R-016 D-002 D-010 | FR-MS-013 | AC-MS-013 | P1 / T001, T007 | T006 | `specs/workflowhub-mechanism-simplification-20260910/prd.md` | ORACLE-C0, ORACLE-FINAL；命令见同ID测试策略行 |
| R-005 R-016 D-002 D-011 | FR-MS-014 | AC-MS-014 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-016 D-013 | FR-MS-015 | AC-MS-015 | P1 / T002 | T001 | `core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs` | ORACLE-C1；命令见同ID测试策略行 |
| R-006 R-016 D-012 D-014 | FR-MS-016 | AC-MS-016 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-016 D-004 | FR-MS-017 | AC-MS-017 | P1 / T001 | none | `specs/workflowhub-mechanism-simplification-20260910/prd.md` | ORACLE-C0；命令见同ID测试策略行 |
| R-016 D-016 | FR-MS-018 | AC-MS-018 | P1 / T001 | none | `specs/workflowhub-mechanism-simplification-20260910/prd.md` | ORACLE-C0；命令见同ID测试策略行 |
| R-008 R-016 D-003 | FR-MS-019 | AC-MS-019 | P1 / T002 | T001 | `core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs` | ORACLE-C1；命令见同ID测试策略行 |
| R-010 R-016 D-008 D-014 | FR-MS-020 | AC-MS-020 | P1 / T005, T006 | T004 | `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs` | ORACLE-C3, ORACLE-C3；命令见同ID测试策略行 |
| R-005 R-006 R-016 D-002 D-009 | FR-MS-021 | AC-MS-021 | P1 / T007 | T006 | `tests/contract/status-derivation.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs` | ORACLE-FINAL；命令见同ID测试策略行 |

R-001为标准五阶段顺序，R-002为上游六类边界，R-003为有界子代理读取，R-004为真实大白话Talk/Grill；本阶段沿用已完成问答不重开。R-011的K1–K9优先保留由AC-MS-002/015/018保护，R-012的母需求覆盖受本任务R-016裁定并投影到全部21FR；R-013的E-1–E-20通过Non-goals和T007边界检查保护，不生成新增实现卡；R-015的旧PRD参考地位由D-001/D-004与AC-MS-017保护。R-005/006映射串行和交接，R-007/008/009/010映射各批，R-014映射三红，R-016覆盖所有当前FR/AC。最终spec-analyze须逐项与decision-log原始索引核对，发现原文差异先修本表。

| 未决/交接 | owner | trigger | handoff / consumer | close / retain condition |
| --- | --- | --- | --- | --- |
| OPEN-001 | make-decision | T-018/019/020与G-001/002/003真实回复已齐 | 下游只读消费既有决定 | 已解决；只读保留，不重问 |
| OPEN-002 | build-spec | 规格冻结前 | 当前spec来源与决策映射 | decision-log §3.7及spec映射已完成初版；最终逐条复核需保留真实结果 |
| OPEN-003 | 当前stage主会话 | 本次阶段末正式通道执行 | 正式stage结果供后续阶段读取 | 按当次真实结果登记；unavailable原样保留，不伪造通过 |
| OPEN-004 | build-spec；build-plan承接工程映射 | C3实施前 | spec §8/§9及T005/T006 | 16键与历史兼容判据已冻结；实施测试仍pending，无法闭合返回owner |
| HANDOFF-001 | 任务ⅡC5 | C3合入后 | C5实现者 | identity/path-cards不再产生写入；本任务仅登记不删除 |
| HANDOFF-002 | 任务ⅡC4与3rd-review | C4开工 | C4实现者及审查调用方 | 同材料改协议可重跑，不再REQUEST_ID_CONFLICT |
| HANDOFF-003 | 宿主 | 宿主行为变化 | build-code使用者 | 宿主不再按phase建立worktree |

延期项为0；不创建DEFER项，不让交接依赖不可得的旧通道许可。三HANDOFF必须经T006写同一stage行，不加行/新对象。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 架构登记 | `docs/architecture/move-map.json`, `docs/architecture/deletion-plan.json` | change，删除必需登记及现有模块职责消费者修正 | T002/T006 | 不能留下悬挂路径，不重组目录 |
| 路径守卫 | `tools/cli/check-task-record-paths.mjs` | change，仅四项登记及本任务删除路径 | T002/T006 | 不整表职责重排 |
| 上游PRD | `specs/workflowhub-mechanism-simplification-20260910/prd.md` | change，仅单行指针 | T001 | D-004唯一例外 |
| 删除边界ADR | `docs/adr/0030-mechanism-simplification-deletion-boundary.md` | no change，保留交付物 | T001/T007 | D-016，非待建项 |
| 宪法/标准/阶段技能正文 | `CONSTITUTION.md`, `docs/standard-workflow.md` | no change | T007 | C7归属，不能借瘦身重写治理 |
| 现有测试 | 各卡精确文件表 | change，仅受影响行为与退场引用 | T002–T006 | 不新增测试文件，不放宽存活行为断言 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"7d028c2919d2ef7749489d4a716be273a0dd986e7ea795a6b052c25a8d5dc12f","id":"CONSTITUTION","version":"1.8.0","clause_count":22}`
- **F1**：复用writer/reader编排，原始执行事实不新增核心状态机。
- **F2**：统一形状与行ref接口，消费者独有认证条件保留。
- **F3**：四材料允许继续；正式写入验证task/worktree/hash，完成另有证据。
- **F4**：一次异源review，finding先修或绑定具体风险，不锁死同task修复。
- **F5**：不新增gate/检查器；无consumer对象有证据才删除。
- **F6**：继续外置唯一执行记录；每次正式写入认证真实运行时。
- **F7**：build-plan末次计划展示后取用户实际确认；Git交付另授权。
- **F8**：同task同worktree，复用现有对象，不复制runner/替代链。
- **F9**：保留三红、unknown、原始失败与身份；不把聚合输出当实测。
- **F10**：使用已有测试和一次性命令，未新增自动验收平台。
- **F11**：唯一owner/consumer/删除条件明确，不以缺审计阻止合法修复。
- **Q1**：测试/审查为事实；缺执行/质量/确认不能宣称完成。
- **Q2**：推进、publication结构、正式完成分开，不以status=ready替代交付。
- **Q3**：质量建议来自wh-review异源provider，主会话只处置。
- **S1**：复用Node/Git/Vitest/既有broker，无新依赖。
- **S2**：只调整必要consumer，不变更审查prompt。
- **S3**：N/A — 本任务不升级外部技能；当前锁定依赖已核对。
- **S4**：不创建自定义技能；原始执行测量继续已有记录。
- **S5**：有界consumer研究独立上下文，写材料主会话执行。
- **S6**：N/A — 无自研通用技能，不为已有删除任务开展外部方案海选。
- **S7**：五阶段/工作流拓扑不变。
- **S8**：可搬运skill不新增跨包runtime依赖；不能为了共用正则破坏独立调用。

## Phase P1 — C0–C3 串行机制瘦身

### Goal

在一个共享文件owner下完成C0/C1/C2/C3四个串行批次，各批唯一可见产物和即时判据保持spec第3节原义。

### Files

- **NEW**：N/A — 不新增生产文件、测试文件、schema 或检查器。
- **MODIFY**：`core/__tests__/capability-doctor.test.mjs`, `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/canonical-utils.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/check-skill-closure.mjs`, `runtime/evidence/dsh-transcript.mjs`, `runtime/evidence/fact-collector.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/quality-fact.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/research-report.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `runtime/evidence/text-utils.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/evidence/write-boundary-preflight.mjs`, `runtime/review/integration-review-subject.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/stage-review-disposition.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/git-worktree-snapshot.mjs`, `runtime/task/material-workspace.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `skills/catalog.yaml`, `skills/mini-task/scripts/mini-task-runner.mjs`, `skills/mini-task/skill-bundle.json`, `skills/wh-review/scripts/ac-evidence-summary.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/skill-bundle.json`, `specs/workflowhub-mechanism-simplification-20260910/prd.md`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/clean-install.mjs`, `tools/architecture/complexity-report.mjs`, `tools/architecture/inventory.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/verify-final-coverage.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/smoke-local-skill-dispatch.mjs`, `tools/cli/task-close.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `workflows/verify-code/design-alignment.mjs`, `runtime/evidence/storage-root.mjs`
- **READ-ONLY CONSUMER**：`tests/contract/decision-convergence-depth.test.mjs`, `tests/contract/stage-interaction-batching.test.mjs`, `tests/close/close-contract.test.mjs` — 仅执行合并后的上游保护合同，不修改文件、不纳入本任务生产改动。
- **DO NOT TOUCH**：`specs/workflowhub-mechanism-simplification-t1-20260911/decision-log.md`, `specs/workflowhub-mechanism-simplification-t1-20260911/spec.md`, `docs/adr/0030-mechanism-simplification-deletion-boundary.md`, `CONSTITUTION.md`, `constitution-checklist.md`, `AGENTS.md`, `CONTEXT.md`, `docs/standard-workflow.md`, `runtime/stage/protocol-error-whitelist.mjs`。MODIFY 内具名删除文件仅可按指定批次整删；其它文件只改列明符号。

### Tasks

- T001：冻结复算记录并加入上游单行指针
- T002：具名叶子、引用测试和四条守卫登记同批清理
- T003：RED：冻结四类定义真实接受集
- T004：GREEN：复用唯一定义且保留不同语义
- T005：RED：唯一行、来源认证和历史只读的失败证据
- T006：GREEN：现有writer和所有读者收敛到当前记录行
- T007：FINAL：聚合21项真实观测与四批即时证据

### Verify

ORACLE-FINAL — P1最终聚合；分批判据沿用ORACLE-C0、ORACLE-C1、ORACLE-C2、ORACLE-C3。T001/C0口径及指针；T002/C1具名清理与保留测试；T003→T004/C2同命令RED/GREEN；T005→T006/C3同命令RED/GREEN、一次14文件与49历史status及1具名身份错误；T007/ORACLE-FINAL在最终快照一次受影响文件并集后聚合。所有精确命令、expected_exit、evidence_path见Test Strategy同ID行和tasks卡。

### Knowledge

12叶子/三红基线/四类定义/16键/50历史目录；source原件不等于派生当前状态；C1退场测试不得在C3再跑。

### STOP

C0缺分子/分母/命令；C1命中K1–K9或路径FAIL>10；C2接受集不符真实producer；C3索引生产读写非零或历史status抛错。停当前批记录incomplete，不跳批、不撤销已过批，不推迟判据。

### Done

四个具名可见产物在各批结束即时验证；21AC有真实观测；task-index确定净减30行；新任务唯一执行文件；历史bytes不变；审查/来源/缺失均如实保留。

### Risks and rollback

关联RISK-001/002/003/004/006与T001–T007；触发即按Rollback and Recovery撤销当前未过批次的本次改动，历史原件/已过批次不动。
