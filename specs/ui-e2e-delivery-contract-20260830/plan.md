# 实现计划：UI 型需求交付契约与端到端验收/证据落位机制

- **Input**：`specs/ui-e2e-delivery-contract-20260830/decision-log.md`、`specs/ui-e2e-delivery-contract-20260830/spec.md`
- **Template version**：`plan-task.v4`

## Quick Read

- **Goal**：UI 型任务从"想清→看见设计→有计划验收→真跑→证据归位→收口有底线"全链路契约生效；F19 类失败在机制上不可重演。
- **Non-goals**：不新增阶段/公共命令/状态机/双写；不动存量产物；纯后端/材料任务 E2E 全量强制延期；外部设计工具集成。来源：decision-log D14（含 Q7/Q10 依据）。
- **Before**：UI 契约条件触发靠自报、不传静默降级（stage-handlers 静默默认+return null）；无 worktree→任务存储证据发布通道；close 对已提交侧车不设防；宪法 F7 仅三处确认。
- **After**：判定必问+四维收敛为 make-decision 完成判据；UI 需求强制高保真原型+用户确认（宪法第四处限定确认 F7 v1.7.0）；plan 强制验收测试 task（范围内 E2E）；build-code 分档真实验收+证据发布；close 侧车结构报错+归档完整性不漂白+自检只列不拦。
- **Main risk**：执行者凑证据/伪造（RISK-01）→ 独立审查+用户确认+来源可复核兜底。
- **Next step**：Phase P1（判定与收敛）T001 RED。

## Technical Context

### Global Constraints

- **Verified facts**：静默默认点（stage-handlers.mjs buildSpecUiFacts 无 contract_facts→non_ui；controlledBrowserQaFacts 缺 facts→return null）；条件 subject 机制已存在（completion-predicates.mjs build-spec ui_design）；quality/evidence writer 映射已存在（canonical-receipt-writer.mjs）；快照排除前缀+preserveExcludedHead 行为（git-worktree-snapshot.mjs）；技能"暂不接入阶段"声明（reuse-registry.md）与"禁止接线"断言（ui-skill-contract.test.mjs）
- **Language / runtime**：Node.js ESM（.mjs），无构建步骤
- **Primary dependencies**：现有 runtime/stage、runtime/evidence、runtime/task、tools/cli；ajv（schema）
- **Storage / state**：任务存储（Knowledge/Projects/<project>/tasks/<task_id>/quality/*）；worktree specs/<task>/
- **Testing**：vitest（tests/contract/、tests/unit/、tests/integration/）；真实浏览器仅 UI dogfooding 场景需要（宿主能力 PFACT-06 unknown）
- **Target environment**：Codex / DSH / 其他宿主（技能可搬运 S8）
- **Scale / scope**：约 10 个生产文件修改 + 1 个新技能 + 1 个文档模板 + 宪法 2 文件 + 新增契约测试
- **Unresolved facts**：PFACT-06（宿主预览能力）→ build-code 处理，如实 unavailable 不伪造

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-handlers.mjs`（make-decision handler、buildSpecUiFacts L1834+、controlledBrowserQaFacts L533+）；`runtime/stage/stage-content-contracts.mjs`（analyzeDecisionConvergence L2228+、validateUiApplicability L1332、validateUiContract L1383、validateComponentQualityMap L1447、validateExecutablePlanTaskMinimum L4916+、validatePlanTaskContractV2 L5113+）；`runtime/stage/completion-predicates.mjs`（STAGE_PREDICATES L53+、条件 subject L182-188）；`runtime/evidence/canonical-receipt-writer.mjs`（writer 映射 L26-32、captureTests L417+）；`runtime/task/git-worktree-snapshot.mjs`（EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES L23、preserveExcludedHead L318-321）；`core/task-close.mjs`（五步编排 L1354+、manual-risk-close）；`tools/cli/stage-runtime.mjs`（status 命令）；`CONSTITUTION.md`、`constitution-checklist.md`
- **Existing interfaces**：publishCanonicalRecord（kernel 单写）；validateUiContract 等纯函数签名；capture-tests CLI 模式
- **Read now**：上述 anchors 各函数的现有断言与测试
- **Must read before task**：tasks.md 各 task 的 boundary 字段所列文件
- **Context mode**：Lite — 锚点已核实，task 级边界精确

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| UI 判定三输入合并 | reuse | `stage-content-contracts.mjs:validateUiApplicability` | 已存在；只改消费强制 |
| make-decision 判定必问+四维收敛 | extend | `stage-handlers.mjs` make-decision handler + `completion-predicates.mjs` STAGE_PREDICATES | 加 ui_applicability+convergence_depth 完成判据 |
| 下游读决策日志（替代自报静默） | extend | `stage-handlers.mjs:buildSpecUiFacts/controlledBrowserQaFacts` | 静默点改显式 missing+读源改为任务事实 |
| 设计源盘点 | reuse | `skills/design-source-readiness` | 已有；改接线声明为 UI 强制消费 |
| 高保真原型渲染 | new | `skills/frontend-prototype-render`（新技能） | consumer=build-spec UI 路径；owner=build-spec；test=技能自测+AC-DSG-002；删除条件=原型能力内化为宿主原生后 |
| 设计确认条件 subject | reuse | `completion-predicates.mjs` ui_design 条件机制 | 已存在；触发源改为决策日志事实 |
| E2E/前端/验收数据 task 校验 | extend | `stage-content-contracts.mjs:validateExecutablePlanTaskMinimum` | 验收 task 的逐场景 `acceptance_data[]` 四字段、tier 枚举、非占位检查与 typed `e2e_scope` |
| 证据发布通道 | extend | `canonical-receipt-writer.mjs`（复用 publishCanonicalRecord） | 加通用 evidence 发布；consumer=build-code/verify-code/close；owner=build-code |
| 浏览器场景证据 | extend | `browser-qa-evidence.v1` + controlled QA capability | 验收场景启用完整四元组绑定；普通 QA 保持兼容 |
| 验收裁决完成判据 | extend | 既有 stage outcome、review writer/result、`completion-predicates.mjs` | 加异源 actor、冻结 review material 与 reviewed execution 绑定 |
| 侧车拦截 | extend | `git-worktree-snapshot.mjs` 排除前缀 + close preflight | 补充前缀清单+fail-loud |
| 归档完整性+自检 | extend | `core/task-close.mjs` + `tools/cli/stage-runtime.mjs status` | 缺口清单输出；不阻塞 |
| .gitignore 约定模板 | new | `docs/templates/project-gitignore.md` | consumer=任务项目仓库；owner=workflowhub 文档；删除条件=close 校验全覆盖后 |
| 宪法 F7 v1.7.0 | modify | `CONSTITUTION.md` + `constitution-checklist.md` | 条文+版本+修订记录+映射+清单同步 |

## Solution Design

### Overview

六域改动共享一条主线：**把"条件触发+自报+静默降级"改为"完成判据+决策日志事实+显式缺口"**。判定（make-decision）产出 ui_applicability 与四维收敛事实写入决策日志；下游阶段（build-spec/build-code/verify-code）从决策日志读判定而非接受自报，缺失即显式 missing_items；build-spec 在 ui 路径上强制"设计源盘点→高保真原型→用户迭代确认"（宪法第四处限定确认）；build-plan 校验强制验收测试 task（范围内端到端）+数据来源；build-code 按档执行真实验收并通过证据发布通道（复用 kernel 单写）把截图/日志写进任务存储；verify-code 完成判据增加 E2E 事实+独立裁决两层；close 快照拦截侧车、归档缺事实不漂白、自检只列不拦。

### Module responsibilities

#### 判定与收敛（make-decision）

- **Responsibility**：ui_applicability 必问+四维收敛检查
- **Consumes**：三输入（原始需求/前端清单/前端事实）+决策日志内容
- **Produces**：决策日志判定事实、收敛缺口清单
- **Must not decide**：不得静默 default non_ui；不得跳过用户问答

#### 设计链路（build-spec，仅 UI）

- **Responsibility**：设计源盘点→高保真原型→迭代确认/授权降级
- **Consumes**：设计权威（Design.md/Experience.md 或反推基线）、现有组件清单、宿主预览能力
- **Produces**：UI 契约+原型材料（specs/<task>/design/）+用户确认事实
- **Must not decide**：不得把原型提交进产品 src/；不得未经用户同意降级提示词包

#### 计划校验（build-plan）

- **Responsibility**：验收测试 task/前端 task/数据来源强制校验
- **Consumes**：plan.md/tasks.md+spec AC 引用
- **Produces**：missing_items 清单
- **Must not decide**：不得发明 FR/AC 语义

#### 执行与证据（build-code）

- **Responsibility**：分档真实验收执行+证据发布+静默消除
- **Consumes**：验收标准（档位+数据来源）+宿主环境
- **Produces**：执行事实+任务存储证据 ref
- **Must not decide**：不作验收通过/不通过裁决（verify-code 职责）

#### 收口（verify-code + close）

- **Responsibility**：E2E 事实+独立裁决完成判据；侧车拦截；归档完整性；自检清单
- **Consumes**：任务存储事实+快照
- **Produces**：缺口清单/结构校验结果
- **Must not decide**：质量结论不混入物理交付记录（close 三义）

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：ui_applicability 事实（字段：result=ui|non_ui|unknown、inputs_ref、user_ruling?）；验收 task 的 `e2e_scope=ui|fullstack|high_risk_user_visible|not_required`（高风险值必须回溯既有 decision refs，禁止从 task risk prose 推断）；browser QA 在验收执行时携带 `acceptance_scenario={source,sample,scenario,tier}`；review result/attempt 绑定 immutable `material_revision={ref,sha256}`、reviewer actor 与 reviewed build-code execution actor/ref；证据发布（字段：source_path、store_ref、publisher、recorded_at；同内容去重）；收敛缺口（字段：dimension、missing）
- **Data flow / state**：判定→决策日志；UI 契约→specs/<task>/design/；验收事实→任务存储 quality/evidence/；close 读任务存储完整性
- **Fail-loud behavior**：缺判定→missing_items；缺契约/组件图/适配器→显式 missing（非 null）；侧车入快照→结构错误；发布失败→如实报错

### UI Delivery Contract

- **UI applicability**：`non_ui` — workflowhub 无前端代码，本任务为契约/机制改造（三输入一致排除）
- 其余 UI 字段：`N/A — 本任务 non_ui`；高保真原型机制本身在 DSG 域作为"UI 需求的功能"被定义，其真实 UI 任务 dogfooding（S1）延后到独立 UI 任务，不作为本任务完成依赖

## 宪法修订定稿（F7 v1.7.0，已于 Q11 用户复核通过）

**F7 修订条文**：
> **F7：推进与不可逆操作经人确认。** 正常业务确认保留 make-decision、build-plan、verify-code 三处。另设一处限定确认：当任务经 make-decision 判定为 UI 型需求（ui_applicability=ui）时，build-spec 阶段的高保真原型设计须由用户确认后方可进入 build-plan（第四处限定确认：仅 UI 型需求触发，确认人为用户，owner 为 build-spec）。非 UI 任务不受此确认影响；build-spec 对非 UI 任务、build-code 对所有任务不新增日常确认。

**修订记录条目**（追加）：
> 1.7.0（2026-08-30）：F7 增加"UI 型需求 build-spec 设计确认"第四处限定确认（仅 ui_applicability=ui 触发）。来源：ui-e2e-delivery-contract-20260830 任务决策 D5（用户 R4-Q9），PB-F19 失败复盘要求"设计必须经用户确认后才进 build-plan"。

**映射**：F7 旧"仅三处确认"→ 新"三处普通确认+一处 UI 限定确认"；其余条款不变；条目数仍 22。

**checklist 同步**：F7 判据增加"UI 型需求：build-spec 设计确认事实存在（display_before_reply+human_approved）"。

## 风险与恢复

| 风险 | 触发 | 最小恢复 |
|---|---|---|
| 校验过严误伤合法任务 | 分档判据误判任务类型 | 用户确认兜底+判据表可调 |
| 原型宿主能力缺失 | PFACT-06 | 如实 unavailable+用户确认替代形式 |
| 契约测试断言"禁止接线"需改 | ui-skill-contract.test.mjs L118 | 改为"UI 需求强制消费"断言并记录变更理由 |

## 验证计划（Verification）

- **契约测试（新增）**：判定必问、四维收敛、下游读日志不静默、原型确认判据、plan 三强制、静默消除、证据发布 roundtrip、侧车拦截、归档完整性
- **回归**：既有 18 个 UI 契约测试+五阶段集成+close 测试全绿
- **E2E（dogfooding，流程级档，AC-DOG-001）**：本任务执行 S2 证据落位+侧车拦截+close 五步、S3 非 UI 缺验收 task 被拒、S4 聚焦回归；S1 真实最小 UI 任务延后到独立后续任务。高风险 service-tier 的 typed scope、任务自身风险决策和 execution-unavailable 语义由 P3/P4 合同测试覆盖；不得把外部任务作为本任务完成依赖。

## File Boundary

### NEW

- `tests/contract/ui-applicability-must-ask.test.mjs`（T001）
- `tests/contract/decision-convergence-depth.test.mjs`（T003）
- `tests/contract/ui-design-confirmation-gate.test.mjs`（T005/T007）
- `tests/contract/frontend-prototype-render-skill.test.mjs`（T007 创建 RED 断言，T008 使同一断言 GREEN）
- `tests/contract/plan-acceptance-task-gate.test.mjs`（T010）
- `tests/review/review-record-route.test.mjs`（T027/T028）
- `tests/contract/acceptance-execution-tier.test.mjs`（T021/T022）
- `tests/contract/evidence-publish-roundtrip.test.mjs`（T012）
- `tests/contract/acceptance-verdict-independence.test.mjs`（T014）
- `tests/contract/close-sidecar-and-archive.test.mjs`（T016）
- `tests/e2e/ui-e2e-contract-dogfood.test.mjs`（T020；T019 使用同一脚本 GREEN）
- `skills/frontend-prototype-render/SKILL.md`（T008）
- `skills/frontend-prototype-render/skill-bundle.json`（T008）
- `docs/templates/project-gitignore.md`（T018）

### MODIFY

- `runtime/stage/stage-handlers.mjs`（make-decision handler 判定事实组装；buildSpecUiFacts/controlledBrowserQaFacts 读源与静默消除；私有 acceptanceExecutionFacts 传当前 decision-log）
- `runtime/stage/stage-runner.mjs`（仅 build-code 注入私有 runAcceptanceScenario capability；P3/P4 投影传当前 decision-log）
- `runtime/stage/completion-predicates.mjs`（STAGE_PREDICATES ui_applicability；ui_design/e2e_acceptance 条件 subject 触发源）
- `runtime/stage/stage-content-contracts.mjs`（analyzeDecisionConvergence 四维；plan 三强制校验；验收数据结构校验）
- `runtime/schemas/browser-qa-evidence.v1.json`（验收 browser 四元组绑定）
- `runtime/review/review-record-route.mjs`（冻结 review material 编排）
- `runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`（canonical actor/material/execution 绑定）
- `runtime/evidence/canonical-receipt-writer.mjs`（通用证据发布）
- `tools/cli/stage-runtime.mjs`（capture-evidence 私有入口；status 缺口清单）
- `runtime/task/git-worktree-snapshot.mjs`（侧车前缀清单+fail-loud）
- `core/task-close.mjs`（归档完整性+manual-risk-close 收紧）
- `skills/reuse-registry.md`、`skills/catalog.yaml`（接线声明）
- `tests/contract/ui-skill-contract.test.mjs`（断言语义改为强制消费）
- `tests/stage-plan-task-contract-v3.test.mjs`（plan-task.v4 结构兼容）
- `workflows/make-decision/SKILL.md`（unknown 必问步骤；高风险事实结构化记录；新任务项目 .gitignore 模板提示）
- `workflows/build-spec/SKILL.md`（设计确认步骤）
- `workflows/build-code/SKILL.md`（受控 QA 验收 binding 合同）
- `skills/isolated-browser-qa/SKILL.md`（验收 browser 运行合同）
- `skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`（冻结 material 与 canonical actor 写入）
- `skills/spec-tasks/templates/tasks-template.md`（验收 task 字段约定）
- `CONSTITUTION.md`、`constitution-checklist.md`（F7 v1.7.0）

### DO NOT TOUCH

- `/Users/Hugh/Hugh/Project/PaperBuilder/` 的既有受跟踪文件、分支和主 worktree（存量产物不动，D14/Q7）；本任务 P6 不创建或写入 PaperBuilder 任务，S1 外部 UI dogfood 另行授权和执行
- `runtime/interface/` 公共命令面（七类不变）
- 任务主仓库 `/Users/Hugh/Hugh/Project/workflowhub`（只读；全部改动在认证 worktree）

## Technical Decisions

### DEC-001 — 下游判定读取源：决策日志事实替代调用方自报

- **Problem**：UI 契约触发依赖调用方传 contract_facts，不传即静默 non_ui（F19 根因）
- **Options**：A 读取决策日志事实；B 强制所有调用方传 facts；C 维持现状
- **Selected**：extend — A
- **Reason**：判定事实在 make-decision 已必问必记，下游读同一事实最少改动且消除自报信任问题
- **Consequence / risk**：需解析决策日志事实；冲突时以日志为准并报冲突
- **Fallback**：日志无事实→显式 unknown missing（不静默）

### DEC-002 — 证据发布通道：复用 kernel 单写而非新建管道

- **Problem**：worktree 截图/日志无官方通道进任务存储
- **Options**：A 扩展 canonical-receipt-writer 通用发布；B close 时搬运；C 新项目命令
- **Selected**：extend — A
- **Reason**：单写内核已存在（publishCanonicalRecord），扩 writer 映射最少新增面
- **Consequence / risk**：writer 需支持二进制文件与去重；发布失败如实报错
- **Fallback**：失败保持 unavailable，不伪造

### DEC-003 — 侧车拦截：快照排除前缀补充+close 前置结构校验

- **Problem**：已提交侧车字节经 preserveExcludedHead 并入 main
- **Options**：A 快照生成时过滤+报错；B close preflight 检查任务分支树；C 只加 .gitignore
- **Selected**：extend — B 为主（close 前置结构校验），A 辅助
- **Reason**：拦截点是交付动作前最后一道；快照过滤保留既有排除语义
- **Consequence / risk**：清单需精确（只含执行侧车前缀，不误伤 specs/ 材料）
- **Fallback**：拦截失败信息含修复指引（先发布到任务存储再 close）

### DEC-004 — 新技能 frontend-prototype-render（真实组件渲染原型）

- **Problem**：高保真原型需要可搬运、可独立调用的渲染能力
- **Options**：A 新技能；B 塞进 stage runtime；C 依赖外部工具
- **Selected**：new — A
- **Reason**：宪法薄核心：能力下沉技能层；S8 可搬运；登记四问（consumer=build-spec UI 路径；owner=build-spec；test=技能自测+AC-DSG-002；删除条件=宿主原生能力替代后）
- **Consequence / risk**：宿主预览能力 unknown（PFACT-06）→ 如实 unavailable
- **Fallback**：用户明确同意后降级提示词包（FR-DSG-003）
- **F10 real threat**：F19 类"无设计确认"真实故障
- **F10 existing cover**：现有 design-source-readiness 只盘点不渲染，不覆盖
- **F10 bypassable**：技能不阻断流程，完成判据在 predicate 层
- **F10 maintenance cost**：单技能+自测，无核心基建
- **F10 disposition**：`keep`

### DEC-005 — 宪法 F7 修订：条文级修订而非治理边界注释

- **Problem**：F7"仅三处确认"与 build-spec 设计确认冲突
- **Options**：A 修订 F7 条文（v1.7.0）；B 治理边界加解释性声明；C 设计确认挪入 build-plan
- **Selected**：modify — A（用户 R4-Q9 拍板）
- **Reason**：B 会造成条文与声明字面冲突；C 时序不符用户要求
- **Consequence / risk**：宪法版本升级，需四同步（条文/修订记录/映射/checklist）
- **Fallback**：条文用户复核不通过→退回 C 路径并记录

### DEC-006 — 验收四元组和独立裁决复用现有证据命名空间

- **Problem**：当前 `ui_scope` 无法表达高风险用户可见任务；browser evidence 没有 `source/sample/tier`；review publication 只保存摘要 hash，verify-code 无法认证谁审了哪份材料和哪次执行。
- **Options**：A 扩展现有 task-card、browser QA、stage outcome 与 review evidence 合同；B 从自由文本风险或 provider 名推断；C 新建独立 Runner/状态机。
- **Selected**：extend — A。
- **Reason**：D6–D9 已要求强制范围、逐场景真实证据与异源裁决。A 只补现有 writer→consumer 链；B 会重演假通过；C 违反不新增控制面的边界。
- **Contract**：`plan-task.v4` 每张最终 acceptance card 必须有 typed `e2e_scope=ui|fullstack|high_risk_user_visible|not_required`；三个 `e2e_*` 字段只能出现在这张卡。`high_risk_user_visible` 还必须同时有 JSON `e2e_decision_refs=["D6","D7"]` 和 `e2e_risk_decision_ref=D<当前任务的高风险判定>`。后者必须指向当前 `decision-log.md` 的同名 D 段，其中唯一结构化字段必须是下面的 Markdown 源码行（JSON 必须在反引号内）：

```md
- **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`
```

其中 `basis` 也可为 `three_inputs`；该 D 段必须被当前 `spec.md` 引用。D6/D7 是全局分档政策，不能单独充当风险判定。不得从 `task risk` 或 provider 名推断。合法矩阵唯一如下：`ui → ui_scope=ui + 至少一条 browser`；`fullstack → ui_scope=fullstack + browser 与 service 各至少一条`；`high_risk_user_visible → ui_scope=non_ui|ui|fullstack，分别要求 service / browser / browser+service`；`not_required → ui_scope=non_ui 且不触发强制 E2E`。其余组合、缺引用、空数组、未知 D ref 或 tier 不合矩阵均 fail-loud。`plan-task.v3` 旧卡只读；投影保留场景但标 `eligible_for_pass=false`/`unavailable`，不能形成新 E2E passed。验收 browser payload 与已发布 bytes 必须逐项匹配完整四元组。review 必须先通过唯一 `freezeReviewMaterial` API 将 bundle 发布为 immutable `{ref,sha256}`，再从该冻结 bytes 重建 provider 输入；attempt/result 只能绑定该 ref、reviewer actor 与 reviewed build-code execution，verify-code 重新读取并认证。
- **Actor contract**：canonical actor 是 `{source_kind,source_id,run_id}`。executor 只能从受认证 stage outcome 的 `producer` 派生：`source_kind=producer.kind`、`source_id=producer.host`、`run_id=producer.agent_run_id`；reviewer 只能从已解析的 trusted review config/provider identity 派生：`source_kind=review_provider`、`source_id=identity.source_id`、`run_id=runtime_id + provider`。独立性只比较受信 `source_id`：相同即同源；`source_kind`、展示 provider、model、临时 run id 的不同都不能单独证明异源。缺任何来源字段即 `missing`，不得由 payload 自报补齐。
- **Owner / consumer / deletion**：`e2e_scope` owner=build-plan, consumer=P3/P4 projection；browser binding owner=controlled QA adapter, consumer=build-code execution；`freezeReviewMaterial` 的唯一持久化 API=canonical receipt writer，编排 owner=wh-review record route，唯一 reader=verify-code E2E reader。相同 bytes 必须返回同一 immutable ref；route 不接受外部自报 ref。材料随任务 evidence 归档策略保留。均不新增公共命令、Runner 或第二写入路径。
- **Failure / compatibility**：普通 controlled QA 不要求该字段；只要作为验收执行则缺字段、hash、身份或当前 binding 一律 `unavailable/missing`。旧材料可读但不构成新 E2E passed。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 和 oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-UID-001/AC-UID-001 | T001 | RED | `npx vitest run tests/contract/ui-applicability-must-ask.test.mjs` / `1` | ORACLE-UID-001：unknown 静默通过 / `quality/tests/p1-t001-red.txt` |
| FR-UID-001/AC-UID-001 | T002 | GREEN | 同 T001 / `0` | ORACLE-UID-001 / `quality/tests/p1-t002-green.txt` |
| FR-CONV-001/AC-CONV-001 | T003 | RED | `npx vitest run tests/contract/decision-convergence-depth.test.mjs` / `1` | ORACLE-CONV-001 / `quality/tests/p1-t003-red.txt` |
| FR-CONV-001/AC-CONV-001 | T004 | GREEN | 同 T003 / `0` | ORACLE-CONV-001 / `quality/tests/p1-t004-green.txt` |
| FR-UID-002,FR-EXE-002/AC-UID-002,AC-EXE-002 | T005 | RED | `npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs` / `1` | ORACLE-UID2-001 / `quality/tests/p2-t005-red.txt` |
| FR-UID-002,FR-EXE-002/AC-UID-002,AC-EXE-002 | T006 | GREEN | 同 T005 / `0` | ORACLE-UID2-001 / `quality/tests/p2-t006-green.txt` |
| FR-DSG-002/AC-DSG-002 | T007 | RED | `npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs` / `1` | ORACLE-DSG-002 / `quality/tests/p2-t007-red.txt` |
| FR-DSG-001/002/003 | T008 | GREEN | `npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs` / `0` | ORACLE-DSG-002（技能合同；真实展示留 P6） / `quality/tests/p2-t008-green.txt` |
| FR-CST-001/AC-CST-001 | T009 | GREEN | 结构断言脚本 / `0` | ORACLE-CST-001 / `quality/tests/p2-t009-constitution.txt` |
| FR-PLN-001/002/003 | T010 | RED | `npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs` / `1` | ORACLE-PLN-001 / `quality/tests/p3-t010-red.txt` |
| FR-PLN-001/002/003 | T011 | GREEN | 同 T010 / `0` | ORACLE-PLN-001 / `quality/tests/p3-t011-green.txt` |
| FR-PLN-001/003 | T023 | RED | 同 T010 / `1` | ORACLE-PLN-002：scope/ref/matrix 缺口 / `quality/tests/p3-t023-red.txt` |
| FR-PLN-001/003 | T024 | GREEN | 同 T010 / `0` | ORACLE-PLN-002：typed scope 投影 / `quality/tests/p3-t024-green.txt` |
| FR-EXE-003/AC-EXE-003 | T012 | RED | `npx vitest run tests/contract/evidence-publish-roundtrip.test.mjs` / `1` | ORACLE-EXE-001 / `quality/tests/p4-t012-red.txt` |
| FR-EXE-003/AC-EXE-003 | T013 | GREEN | 同 T012 / `0` | ORACLE-EXE-001 / `quality/tests/p4-t013-green.txt` |
| FR-PLN-003,FR-EXE-001/AC-PLN-003,AC-EXE-001 | T021 | RED | `npx vitest run tests/contract/acceptance-execution-tier.test.mjs` / `1` | ORACLE-EXE-002 / `quality/tests/p4-t021-red.txt` |
| FR-PLN-003,FR-EXE-001/AC-PLN-003,AC-EXE-001 | T022 | GREEN | 同 T021 / `0` | ORACLE-EXE-002：每场景事实或 unavailable / `quality/tests/p4-t022-green.txt` |
| FR-VER-001/AC-VER-001 | T014 | RED | `npx vitest run tests/contract/acceptance-verdict-independence.test.mjs` / `1` | ORACLE-VER-001 / `quality/tests/p4-t014-red.txt` |
| FR-VER-001/AC-VER-001 | T015 | GREEN | 同 T014 / `0` | ORACLE-VER-001 / `quality/tests/p4-t015-green.txt` |
| FR-PLN-003,FR-EXE-001 | T025 | RED | `npx vitest run tests/contract/acceptance-execution-tier.test.mjs` / `1` | ORACLE-EXE-003：browser 双边绑定 / `quality/tests/p4-t025-red.txt` |
| FR-PLN-003,FR-EXE-001 | T026 | GREEN | 同 T025 / `0` | ORACLE-EXE-003 / `quality/tests/p4-t026-green.txt` |
| FR-VER-001/AC-VER-001 | T027 | RED | `npx vitest run tests/review/review-record-route.test.mjs tests/contract/acceptance-verdict-independence.test.mjs` / `1` | ORACLE-VER-002：冻结输入与 actor 链 / `quality/tests/p4-t027-red.txt` |
| FR-VER-001/AC-VER-001 | T028 | GREEN | 同 T027 / `0` | ORACLE-VER-002 / `quality/tests/p4-t028-green.txt` |
| FR-CLS-001/002/003 | T016 | RED | `npx vitest run tests/contract/close-sidecar-and-archive.test.mjs` / `1` | ORACLE-CLS-001 / `quality/tests/p5-t016-red.txt` |
| FR-CLS-001/002/003 | T017 | GREEN | 同 T016 / `0` | ORACLE-CLS-001 / `quality/tests/p5-t017-green.txt` |
| FR-CNV-001/AC-CNV-001 | T018 | GREEN | 模板存在性检查 / `0` | ORACLE-CNV-001 / `quality/tests/p5-t018-gitignore.txt` |
| AC-DOG-001,AC-EXE-001,AC-DSG-001/002/003,AC-VER-001 | T020 | RED | `npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs` / `1` | ORACLE-DOG-001 / `quality/tests/p6-t020-red.txt` |
| AC-DOG-001,AC-EXE-001,AC-DSG-001/002/003,AC-VER-001 | T019 | 验收 | 机械命令同 T020 / `0` | ORACLE-DOG-001：再需原型/用户确认/异源身份/冻结 review ref/`e2e_acceptance=satisfied` / `quality/evidence/dogfood/` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 task 实现改动，保留四份材料和既有质量事实；单 task 粒度回退（paired RED/GREEN 同进退）
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 需用户明确授权（F7）；宪法修订落字需条文复核通过
- **Recovery owner**：build-code 执行者；宪法文本=用户

### Engineering Risk Handoff

- **PLAN-RISK-001**：旧格式材料兼容性（决策日志/plan 旧结构误报）
  - **Affected IDs**：FR-CONV-001, FR-PLN-001, T004, T011
  - **Trigger**：历史任务材料走新校验
  - **Consequence**：旧任务被误报缺缺口
  - **Mitigation or STOP**：新校验只对新结构强制，legacy 宽容读取并记录
  - **Handling Stage**：build-code
  - **Verification**：回归测试含 legacy 样本
- **PLAN-RISK-002**：宿主预览能力缺失
  - **Affected IDs**：FR-DSG-002, PFACT-06, T008, T019
  - **Trigger**：宿主无法起 dev server/截图
- **Consequence**：外部 S1 场景浏览器级演示仍未执行，作为独立后续任务跟踪
  - **Mitigation or STOP**：如实 unavailable 留痕；不伪造截图
  - **Handling Stage**：build-code
  - **Verification**：unavailable 事实存在且未被改写为通过

## Implementation Order

T020（P6 验收脚本 RED 基线）→ P1（判定与收敛）→ P2（设计链路+宪法）→ P3（计划校验）→ P4（执行与证据）→ P5（收口）→ P6/T019（本地 S2-S4 GREEN 验收）。T020 的 S1 断言保留为历史 RED/外部后续参考，不作为当前任务执行项；P2 依赖 P1 的判定事实；P3 校验依赖 P1/P2 的语义；P4 证据通道是 P5 拦截的修复指引前提；T019 依赖本地前置 GREEN。

## Dependencies and Parallelism

- **Dependencies**：T020→T019（同一 dogfooding oracle 的 RED/GREEN）；T002→T005→T006→T007→T008（判定事实→下游读源→确认判据→技能接线）；T010→T011→T023→T024→T025→T026（计划 scope→browser 执行）；T024→T027→T028（typed scope→冻结审查链）；T012→T013→T021→T022（证据发布→逐场景执行事实）；T013→T016→T017（证据通道→拦截指引）；全部→T019
- **Parallel work**：T001 与 T003（独立测试文件）；T009（宪法文档）与 T005-T008（独立文件）；T018（模板+make-decision 创建提示）与 T016
- **External dependencies**：真实任务存储（Knowledge/Projects/workflowhub/tasks/）；宿主 vitest；宿主预览能力（PFACT-06 unknown，absence semantics=unavailable 如实记录）

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| D1, R-F19-01 | FR-UID-001 | AC-UID-001 | P1/T001-T002 | none | `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-handlers.mjs` | vitest / ORACLE-UID-001 |
| D1 | FR-UID-002 | AC-UID-002 | P2/T005-T006 | T002 | `runtime/stage/stage-handlers.mjs` | vitest / ORACLE-UID2-001 |
| D2, R-F19-01 | FR-CONV-001 | AC-CONV-001 | P1/T003-T004 | none | `runtime/stage/stage-content-contracts.mjs` | vitest / ORACLE-CONV-001 |
| D4 | FR-DSG-001 | AC-DSG-001 | P2/T008 + P6/T019 | T007 | `skills/reuse-registry.md`, `skills/catalog.yaml`, `tests/contract/frontend-prototype-render-skill.test.mjs` | 技能合同 + 原型/确认事实 / ORACLE-DSG-002 |
| D3, D5 | FR-DSG-002 | AC-DSG-002 | P2/T007-T008 + P6/T019 | T006 | `runtime/stage/completion-predicates.mjs`, `skills/frontend-prototype-render/` | predicate + 原型/确认事实 / ORACLE-DSG-001/002 |
| D3 | FR-DSG-003 | AC-DSG-003 | P2/T008 + P6/T019 | T007 | `skills/frontend-prototype-render/`, `workflows/build-spec/SKILL.md` | 技能合同 + 用户降级/确认事实 / ORACLE-DSG-002 |
| D6, D7 | FR-PLN-001 | AC-PLN-001 | P3/T010-T011,T023-T024 | T011 | `runtime/stage/stage-content-contracts.mjs`, `skills/spec-tasks/templates/tasks-template.md` | vitest / ORACLE-PLN-001/002 |
| D6 | FR-PLN-002 | AC-PLN-002 | P3/T010-T011 | none | `runtime/stage/stage-content-contracts.mjs` | vitest / ORACLE-PLN-001 |
| D6,D7(Q5-2) | FR-PLN-003 | AC-PLN-003 | P3/T010-T011,T023-T024 + P4/T021-T022,T025-T026 | T024 | `runtime/stage/stage-content-contracts.mjs`, `skills/spec-tasks/templates/tasks-template.md`, `runtime/stage/stage-handlers.mjs`, `runtime/schemas/browser-qa-evidence.v1.json`, `runtime/stage/stage-runner.mjs` | plan contract + execution facts / ORACLE-PLN-001/002/EXE-002/003 |
| D8(Q5) | FR-EXE-001 | AC-EXE-001 | P4/T021-T022 + P6/T019 | T013,T021 | `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-runner.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`, `tests/e2e/ui-e2e-contract-dogfood.test.mjs` | 三档执行事实 + real dogfood / ORACLE-EXE-002/DOG-001 |
| D8 | FR-EXE-002 | AC-EXE-002 | P2/T005-T006 | T002 | `runtime/stage/stage-handlers.mjs` | vitest / ORACLE-UID2-001 |
| D10 | FR-EXE-003 | AC-EXE-003 | P4/T012-T013 | none | `runtime/evidence/canonical-receipt-writer.mjs`, `tools/cli/stage-runtime.mjs` | vitest / ORACLE-EXE-001 |
| D9(Q3) | FR-VER-001 | AC-VER-001 | P4/T014-T015,T027-T028 + P6/T019 | T022,T024 | `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/schemas/{attempt,result}.schema.json`, `runtime/evidence/canonical-receipt-writer.mjs`, `tests/e2e/` | rehashed frozen input + canonical actor + verify-code 事实 / ORACLE-VER-001/002 |
| D11 | FR-CLS-001 | AC-CLS-001 | P5/T016-T017 | T013 | `runtime/task/git-worktree-snapshot.mjs`, `core/task-close.mjs` | vitest / ORACLE-CLS-001 |
| D11 | FR-CLS-002 | AC-CLS-002 | P5/T016-T017 | T013 | `core/task-close.mjs` | vitest / ORACLE-CLS-001 |
| D11 | FR-CLS-003 | AC-CLS-003 | P5/T016-T017 | T013 | `tools/cli/stage-runtime.mjs` | vitest / ORACLE-CLS-001 |
| D12 | FR-CNV-001 | AC-CNV-001 | P5/T018 | none | `docs/templates/project-gitignore.md`, `workflows/make-decision/SKILL.md` | 模板+创建提示检查 / ORACLE-CNV-001 |
| D5 | FR-CST-001 | AC-CST-001 | P2/T009 | 用户条文复核 | `CONSTITUTION.md`, `constitution-checklist.md` | 结构断言 / ORACLE-CST-001 |
| D13 | （全部） | AC-DOG-001 | P6/T019 | 全部 GREEN + 用户确认 + 独立审查 | `tests/e2e/` | 机械 vitest + 人工/独立事实 / ORACLE-DOG-001 |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法 | `CONSTITUTION.md`, `constitution-checklist.md` | change | T009 | F7 v1.7.0 限定确认修订（D5） |
| 技能登记 | `skills/reuse-registry.md`, `skills/catalog.yaml` | change | T008 | 三技能接线声明改为 UI 强制消费 |
| 技能（新增） | `skills/frontend-prototype-render/` | change | T008 | 高保真原型渲染能力（DEC-004 四问已登记） |
| 流程文档 | `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md` | change | T002, T008, T024 | 判定必问+高风险结构化事实+设计确认步骤 |
| 验收范围投影 | `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/{stage-handlers,stage-runner}.mjs`, `skills/spec-tasks/templates/tasks-template.md` | change | T023, T024 | owner=build-plan；consumer=build-code/verify-code current-material projection；v3 只读不成通过 |
| browser QA 合同 | `runtime/schemas/browser-qa-evidence.v1.json`, `runtime/stage/stage-runner.mjs`, `skills/isolated-browser-qa/SKILL.md`, `workflows/build-code/SKILL.md` | change | T025, T026 | owner=controlled QA adapter；consumer=build-code；验收路径才要求四元组 |
| 审查冻结材料 | `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/schemas/{attempt,result}.schema.json`, `skills/wh-review/scripts/{simple-review-runner,wh-review-cli}.mjs` | change | T027, T028 | single API=freezeReviewMaterial；route 编排；consumer=verify-code re-reader；任务归档后保留 |
| 测试断言 | `tests/contract/ui-skill-contract.test.mjs` | change | T008 | "禁止接线"断言改为"UI 强制消费"（语义反转，记录理由） |
| 文档模板 | `docs/templates/project-gitignore.md` | change | T018 | 侧车排除约定（D12） |
| 公共命令面 | `runtime/interface/` | no change | — | 七类公共命令不变（宪法边界） |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"25f4c883523d673736d487dba8b41a2e2a063e12b61de0f2223b373e7c4d2b20","id":"CONSTITUTION","version":"1.6.0","clause_count":22}`
- **F1**：单一需求权威源——所有 FR 回溯 decision-log D1-D15，无新增需求 ✓
- **F2**：用户代理决策已确认（17 决策点+Q9/Q10 拍板）✓
- **F3**：四材料推进不变；本次只细化同一份材料 ✓
- **F4**：审查保持 advice-only（盲审 8 findings 处置记录，无 pass gate）✓
- **F5**：F19 真实故障对应最小检查；分两阶段避免过度泛化 ✓
- **F6**：质量事实机器采集（E2E 事实/证据发布记录）✓
- **F7**：本任务自身修订 F7（v1.7.0 条文经用户复核后落字）；提交/合并等不可逆操作待授权 ✓
- **F8**：—（无外部接口变更）✓
- **F9**：侧车入快照=结构错误 fail-loud；不假绿 ✓
- **F10**：唯一新增技能登记四问（DEC-004）；无 gate 基建；既有教训（9.5 万行 gate 代码）对照——本计划只扩展既有校验函数 ✓
- **F11**：新增控制面（证据发布入口）登记唯一 consumer/owner/替代/删除条件 ✓
- **Q1/Q2**：完成判据非推进门；缺事实不宣称完成（close 不漂白）✓
- **Q3**：验收裁决独立（FR-VER-001）；本计划自身验收=独立审查+用户确认 ✓
- **S1**：改动定位运行时/技能/文档既有分区 ✓
- **S2**：窄契约（复用 writer/predicate 机制）✓
- **S3**：无新增状态机 ✓
- **S4**：新技能带自测与使用场景 ✓
- **S5**：技能子代理可调用（SKILL.md 独立说明）✓
- **S6**：—（无编排变更）✓
- **S7**：技能层实现为主，核心最小改动 ✓
- **S8**：技能可搬运（不绑宿主；宿主能力缺失如实 unavailable）✓

## Phase P1 — 判定与收敛（UID/CONV）

### Goal

make-decision 完成判据包含 ui_applicability（unknown 必问）与四维收敛检查。

### Files

- **NEW**：`tests/contract/ui-applicability-must-ask.test.mjs`、`tests/contract/decision-convergence-depth.test.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`（make-decision handler）、`runtime/stage/completion-predicates.mjs`（STAGE_PREDICATES）、`runtime/stage/stage-content-contracts.mjs`（analyzeDecisionConvergence）、`workflows/make-decision/SKILL.md`（判定必问步骤）
- **DO NOT TOUCH**：`runtime/evidence/`（本期不动）、`core/task-close.mjs`（P5 才动）

### Tasks

- `T001：RED 判定必问契约测试`
- `T002：GREEN ui_applicability 完成判据实现`
- `T003：RED 四维收敛测试`
- `T004：GREEN 四维收敛实现`

### Verify

`npx vitest run tests/contract/ui-applicability-must-ask.test.mjs tests/contract/decision-convergence-depth.test.mjs`，expected_exit=0；oracle=ORACLE-UID-001/ORACLE-CONV-001；evidence_path=`quality/tests/p1-*.txt`。

### Knowledge

条件 subject 机制复用 build-spec ui_design 先例；legacy 决策日志宽容读取。

### STOP

影响非 UI 任务既有 make-decision 行为→回 build-spec 复核边界。

### Done

AC-UID-001、AC-CONV-001 判据生效；既有契约测试全绿。

### Risks and rollback

旧格式误报（PLAN-RISK-001）→legacy 宽容分支；回退=还原 T002/T004 改动。

## Phase P2 — 设计链路（DSG）与宪法修订（CST）

### Goal

UI 需求 build-spec 强制设计源盘点+高保真原型+用户确认；宪法 F7 v1.7.0 落地。

### Files

- **NEW**：`tests/contract/ui-design-confirmation-gate.test.mjs`、`tests/contract/frontend-prototype-render-skill.test.mjs`、`skills/frontend-prototype-render/SKILL.md`、`skills/frontend-prototype-render/skill-bundle.json`（+最小自测）
- **MODIFY**：`runtime/stage/stage-handlers.mjs`（buildSpecUiFacts 读源）、`runtime/stage/completion-predicates.mjs`（ui_design 触发源）、`skills/reuse-registry.md`、`skills/catalog.yaml`、`tests/contract/ui-skill-contract.test.mjs`（断言改为强制消费语义）、`workflows/build-spec/SKILL.md`（设计确认步骤）、`CONSTITUTION.md`、`constitution-checklist.md`
- **DO NOT TOUCH**：`runtime/task/git-worktree-snapshot.mjs`（P5）、PaperBuilder 仓库（任何文件）

### Tasks

- `T005：RED 下游读日志不静默测试`
- `T006：GREEN 读源改决策日志+静默消除`
- `T007：RED 原型确认判据测试`
- `T008：GREEN 确认判据+技能接线+原型技能可执行合同`
- `T009：宪法 F7 v1.7.0 修订（条文经用户复核）`

### Verify

`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs tests/contract/`，expected_exit=0；宪法结构断言过；oracle=ORACLE-UID2-001/ORACLE-DSG-001/ORACLE-DSG-002/ORACLE-CST-001；evidence_path=`quality/tests/p2-*.txt`。

### Knowledge

静默点已改显式 missing；ui_design 触发源=决策日志事实；原型技能的输入、真实组件渲染命令、任务存储证据输出和降级前用户同意均有可执行合同；PaperBuilder 真实 UI 运行与人工设计确认由独立后续 UI 任务负责。

### STOP

既有 18 个 UI 契约测试语义性破坏→回 build-spec 复核；条文与复核文本不一致→停。

### Done

AC-UID-002、AC-EXE-002、AC-CST-001 生效；AC-DSG-001/002/003 的机制与技能合同生效，真实组件渲染、截图/预览与用户确认仅由 T019 取得事实，P2 不提前宣称人工验收完成。

### Risks and rollback

接线断言反转误伤→逐条对照 catalog；宪法回退需用户授权。

## Phase P3 — 计划校验（PLN）

### Goal

plan 三强制校验生效（E2E task 范围内/前端 task UI/所有验收 task 的逐场景 `acceptance_data[]` 四字段与档位枚举），并以 `plan-task.v4` 将强制范围投影固定到唯一最终验收卡。

### Files

- **NEW**：`tests/contract/plan-acceptance-task-gate.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`（validateExecutablePlanTaskMinimum/validatePlanTaskContractV2/typed projection）、`runtime/stage/stage-handlers.mjs`（P4 只传当前 decision-log/spec）、`runtime/stage/stage-runner.mjs`（P4 只传当前 decision-log/spec）、`skills/spec-tasks/templates/tasks-template.md`（plan-task.v4 验收 task 字段约定）、`workflows/make-decision/SKILL.md`（高风险结构化事实）、`tests/stage-plan-task-contract-v3.test.mjs`（plan-task.v4 结构兼容）
- **DO NOT TOUCH**：`runtime/stage/completion-predicates.mjs`（P1/P2 已动，P3 不再动）

### Tasks

- `T010：RED plan 验收 task 强制测试`
- `T011：GREEN 三强制校验实现`
- `T023：RED typed e2e_scope 强制范围测试`
- `T024：GREEN typed e2e_scope 投影与模板实现`

### Verify

`npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs`，expected_exit=0；oracle=ORACLE-PLN-001/ORACLE-PLN-002；evidence_path=`quality/tests/p3-*.txt`。

### Knowledge

验收 task 唯一以 `acceptance_role=acceptance` 标记；UI task 以 `ui_scope=ui` 识别；验收数据唯一字段 `acceptance_data[]={source,sample,scenario,tier}`，每场景四项缺一或 tier 非 browser/service/command 均不合格。`plan-task.v4` 的最终验收卡唯一声明 `e2e_scope=ui|fullstack|high_risk_user_visible|not_required`；高风险再由当前 decision-log 的结构化 `high_risk_fact` 与 D6/D7 决策引用认证，不能由 task risk prose、无关 D ref 或 provider 推断。v3 仍可读取场景，但投影不可 passed。真实来源是否能解析只能在 build-code 留事实。

### STOP

旧 plan 大面积误伤→`plan-task.v3` 保留 legacy 可读且投影不可通过；v4 缺 scope/错位置 fail-loud；不从自由文本猜测 scope。

### Done

AC-PLN-001/002/003 生效；v4 UI/fullstack/high-risk 强制范围均有 typed 来源与唯一消费者；v3 场景可读但不能形成 E2E passed；既有 plan 测试绿。

### Risks and rollback

普通 task 误判→显式字段优先；回退=还原 T024 的校验函数与模板改动。

## Phase P4 — 执行与证据（EXE/VER）

### Goal

逐场景真实验收执行事实与证据发布通道落地；静默消除；可验证异源的 verify-code 验收裁决判据。

### Files

- **NEW**：`tests/contract/evidence-publish-roundtrip.test.mjs`、`tests/contract/acceptance-verdict-independence.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、`tests/review/review-record-route.test.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`（通用证据发布与 review material 单写）、`tools/cli/stage-runtime.mjs`（capture-evidence 私有入口）、`runtime/schemas/browser-qa-evidence.v1.json`（验收 browser 四元组）、`runtime/stage/stage-content-contracts.mjs`（唯一验收投影与 typed scope）、`runtime/stage/stage-handlers.mjs`（私有 acceptanceExecutionFacts/e2e 判据）、`runtime/stage/stage-runner.mjs`（build-code 私有 QA capability 与 canonical readers）、`runtime/stage/completion-predicates.mjs`（verify-code e2e_acceptance 条件 subject）、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/isolated-browser-qa/SKILL.md`、`workflows/build-code/SKILL.md`
- **DO NOT TOUCH**：`CONSTITUTION.md`（P2 已定稿）、`skills/frontend-prototype-render/`（P2 已定稿）

### Tasks

- `T012：RED 证据发布 roundtrip 测试`
- `T013：GREEN publishEvidence+capture-evidence 私有入口`
- `T021：RED 逐场景真实执行事实测试`
- `T022：GREEN acceptanceExecutionFacts 三档执行实现`
- `T014：RED 验收裁决独立性测试`
- `T015：GREEN e2e_acceptance 条件 subject`
- `T025：RED browser 验收四元组绑定测试`
- `T026：GREEN browser 验收绑定与受控 QA 合同`
- `T027：RED review 冻结材料与异源 actor 链测试`
- `T028：GREEN review writer→verify-code 独立裁决合同`

### Verify

`npx vitest run tests/contract/evidence-publish-roundtrip.test.mjs tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-verdict-independence.test.mjs tests/review/review-record-route.test.mjs`，expected_exit=0；oracle=ORACLE-EXE-001/ORACLE-EXE-002/ORACLE-EXE-003/ORACLE-VER-001/ORACLE-VER-002；evidence_path=`quality/tests/p4-*.txt`。

### Knowledge

发布复用 kernel 单写；capture-evidence 私有非公共；`acceptanceExecutionFacts` 逐场景读取 P3 解析投影。验收 browser 只在 payload 和 canonical stored bytes 都匹配完整四元组时执行；无 host adapter 仍 explicit unavailable。review route 先调用 `freezeReviewMaterial`，随后只从该 immutable bytes 重建 provider input；attempt/result 同时写 `{ref,sha256}`、provider-input hash、reviewed execution ref/hash 及 canonical actor。verify reader 重新读取 hash 并以 `source_id` 判定同源，不能相信 provider/display/run 自报。

### STOP

需改 kernel 公共接口→停并回报；缺某档执行适配器→写 explicit unavailable，不得伪装 browser；frozen A 却审 B、重复发布返回新 ref、route 接收外部自报 ref、或缺当前 hash 正确的 bundle/actor/execution binding→拒绝；影响非强制范围 verify-code→缩小触发。

### Done

AC-EXE-001/003、AC-VER-001 生效；所有三档场景只会产生真实完整绑定的执行事实或 unavailable；review 的 material、actor、execution 三项都可被 verify-code 重读认证；既有证据/谓词测试绿。

### Risks and rollback

测试污染真实任务存储→仅临时目录；frozen review material 篡改或旧快照→拒绝认证；回退=还原本 phase writer/reader/schema 改动。

## Phase P5 — 收口（CLS/CNV）

### Goal

close 侧车拦截+归档完整性+自检只列不拦；隔离 fixture 覆盖正常五步 close；.gitignore 模板。

### Files

- **NEW**：`tests/contract/close-sidecar-and-archive.test.mjs`、`docs/templates/project-gitignore.md`
- **MODIFY**：`runtime/task/git-worktree-snapshot.mjs`（侧车清单+fail-loud）、`core/task-close.mjs`（归档完整性+manual-risk-close 收紧）、`tools/cli/stage-runtime.mjs`（status 缺口清单输出）、`workflows/make-decision/SKILL.md`（新任务项目 .gitignore 模板提示）
- **DO NOT TOUCH**：`runtime/evidence/`（P4 已定稿）、PaperBuilder 仓库

### Tasks

- `T016：RED 侧车拦截+归档完整性+正常五步 close 测试`
- `T017：GREEN close 拦截+归档+自检+正常五步编排实现`
- `T018：.gitignore 约定模板与新任务创建提示`

### Verify

`npx vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/ tests/unit/task/`，expected_exit=0；oracle=ORACLE-CLS-001/ORACLE-CNV-001；evidence_path=`quality/tests/p5-*.txt`。

### Knowledge

侧车清单只含执行侧车前缀；自检追加字段不改 status 既有结构；正常 close 五步只能按 `commit→merge→archive→push→cleanup` 在隔离临时 repo、显式 test authorization 和本地 bare remote 下验证，不触碰真实任务或远端。

### STOP

正常任务 close 五步被破坏→回退到最小改动。

### Done

AC-CLS-001/002/003、AC-CNV-001 生效；隔离 fixture 的正常五步编排成功。

### Risks and rollback

误拦设计材料→清单仅执行侧车前缀；回退=还原三生产文件+文档。

## Phase P6 — 本地契约 dogfooding（S2-S4，最终验收 task）

### Goal

AC-DOG-001 本地三场景真实执行：S2 证据落位与拦截、S3 非 UI 底线、S4 聚焦回归。S1 的 PaperBuilder 原型/浏览器/身份链为独立后续 UI 任务；本 P6 不创建、推断或混入其事实。高风险 service-tier 的分类和 unavailable 语义只由 P3/P4 合同覆盖。

### Files

- **NEW**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`（T020 的历史 RED 基线保留；T019 只运行本地 S2-S4）
- **MODIFY**：N/A — 验收阶段只执行不修改生产代码
- **DO NOT TOUCH**：所有 WorkflowHub 生产文件之外的 PaperBuilder 文件、分支、任务存储和主 worktree；本阶段不调用 task-bootstrap，不启动浏览器。

### Tasks

- `T020：RED dogfooding 验收断言脚本`
- `T019：GREEN 本地三场景 dogfooding（S2-S4，最终验收 task）`

### Verify

机械检查：`npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，expected_exit=0；本地事实：S2 隔离 close fixture、S3 非 UI 缺验收 task 拒绝、S4 聚焦契约回归均须真实通过；S1 外部 UI 事实不在本任务 evidence_path，也不作为当前通过条件。oracle=ORACLE-DOG-001；evidence_path=`quality/evidence/dogfood/`（本地任务存储）。跳过的外部 S1 必须保留 deferred 记录，不能改写为通过。

### Knowledge

本阶段只使用 WorkflowHub 本地隔离 fixture 和当前任务存储；不创建 PaperBuilder 演示任务。S1 的高保真原型、用户确认、异源身份、冻结/canonical review ref 与 `e2e_acceptance=satisfied` 由独立 UI 后续任务负责，当前仅记录 deferred。

### STOP

S2/S3/S4 无法真实执行→如实 unavailable/incomplete 报告用户；禁止伪造本地命令或任务存储事实。S1 外部事实缺失保持 deferred，不触发本任务阻塞。

### Done

S2/S3/S4 本地事实采集完成，且聚焦回归绿；S1 明确记录为外部后续任务 deferred，不写当前通过。S2 的 close 行为只使用 T016 的隔离临时 fixture 按 `commit→merge→archive→push→cleanup` 验证。

### Risks and rollback

本地 fixture 污染任务存储→测试清理；回退=移除临时 fixture。外部 S1 另行授权后执行，不在本阶段创建。
