# 实现计划：处理组 6、7、8 残留闭环与 WorkflowHub 执行质量

> 基于当前任务的 `spec.md`。这份文件负责工程方案、文件边界、阶段顺序和测试设计；产品需求仍以 `spec.md` 为准。

- **Input**：`specs/multica-issues-monitoring-g6-g7-20260805/spec.md`
- **Status**：P1—P5 Phase handoff review 已按当前任务合同达到 pass；verify-code 已完成一次有限架构师流程，最终全量测试已通过；正式结论仍为 incomplete，仅因本轮没有重复生成逐 AC 专属语义证据
- **Template version**：`plan-task.v3`
- **Spec SHA-256**：`21563eaef286bb1ebe07a7610f004a1a63e1c118ddb44f653caaee96ef311d3b`
- **Decision-log SHA-256**：`26b303b1170c062b5be34c8efb87bbe4e8131b28529abf79a64992162aba6c9c`

## 1. 速读卡

- **Goal**：让当前四份材料、阶段技能、review 语义、组 6/7 证据和组 8 登记校验形成一条可回放的 vNext 链路。
- **Non-goals**：不恢复旧 control plane，不新增产品页面，不改历史归档正文，不让 build-code 重新设计测试。
- **Before**：make-decision 没有受控 ArtifactDir；技能声明和实际 invocation 可能脱节；review 建议容易被当成 pass；组 6/7 事实不完整；组 8 inventory 有差异。
- **After**：四份当前材料都在 `specs/<task>/`；build-plan 高智力模型输出完整执行合同；build-code 普通模型按顺序执行；缺事实会明确失败或 `incomplete`。
- **Main risk**：plan/tasks 仍漏掉命令、oracle、证据或文件边界，导致执行模型自行猜测。
- **Next step**：保留 verify=`incomplete` 的证据边界，不再开启审查循环；close 仍不执行。

## WorkflowHub Stage Progress

| Stage | Status | Work / artifacts | Review / handoff | Next / deferred risk |
| --- | --- | --- | --- | --- |
| make-decision | completed | `decision-log.md`；R-001—R-011、D-001—D-019 | `quality_status=advisory`；Grill 已在用户可见对话中完成，用户已授权连续推进 | 正式 runtime publication 仍需绑定新 revision |
| build-spec | completed | `spec.md`；FR-G6/G7/G8、FR-WH、AC 和边界 | `quality_status=advisory`；本计划不把 review verdict 当 pass | 产品歧义未解决时必须回 make-decision |
| build-plan | completed | 本文件和 `tasks.md`；D-015 的顺序、技能调用和测试预判已写入 | `quality_status=advisory`；spec-analyze 与主 agent finding 处置已记录 | build-code 按 P5 任务卡执行 |
| build-code | completed | P1—P4 已有 pass；P5 最近一次阶段审查 `build-code-default-96050729f27afe87774b70dddefbe7404ea39941-dabdbcc3-a985-45fe-9c00-6c7475ce162d.json` 为 pass，P5 current-v14 定向测试 exit 0 | `quality_status=phase-pass`；P5 的历史 unavailable 事实保留，不覆盖最近 pass | 已完成 Phase handoff；最终完整测试与 verify-code 只检查当前整体快照 |
| verify-code | incomplete | P6 bounded architect flow 完成；focused 158 tests exit 0；唯一独立 review 已完成；最终 npm test safe 148/1290、exclusive 2/31 全部通过 | `quality_status=incomplete`；测试已通过，但逐 AC 专属语义证据仍为 unknown | 向用户做事实交接；close 不执行 |

各行含义：当前材料是受控 ArtifactDir 内容；`quality_status` 只描述事实，不是推进许可证；`user_handoff` 是本轮对用户的中文交接；`risks_deferred` 见第 12 节。

## 2. Technical Context and Constraints

- **Language / runtime**：Node.js ESM；仓库要求 Node `>=24`；测试使用 Vitest/仓库现有 npm scripts。
- **Primary dependencies**：`ArtifactDir` 管当前四份材料；`TaskKernel`/quality records 管外置执行事实；`wh-review` 是 review provider owner；已有 stage skill runtime 负责 invocation fact。
- **Storage / state**：当前材料只在 `<worktree>/specs/<task>/`；任务事实只写现有 `facts.jsonl`、`quality/reviews/`、`quality/tests/` 等 vNext 位置；历史 archive/inventory 只读或登记事实，不成为运行时输入。
- **Testing**：每个行为改动先 RED 后 GREEN；build-plan 由 `test-routing-advisor` 预判每个 Phase/最终测试的 tier 和 expected skill，但不调用具体 testing skill；build-code 检查真实 changed files，必要时重路由，再调用 concrete testing skill 并执行测试。
- **Target environment**：macOS 本地工作树、独立 candidate worktree；无浏览器页面，因此 `browser_route=N/A`，不调用 frontend-testing。
- **Project type**：WorkflowHub 编排运行时、阶段技能、质量证据和架构登记工具。
- **Performance goals**：N/A。目标是事实完整、边界清楚和不重复审查，不引入新的吞吐指标。
- **Scale / scope**：一个 vNext task；四份当前材料；组 6/7 的运行时与 review 事实；组 8 的登记文件。
- **Relevant ADR / context**：`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`docs/adr/0009-stage-content-authority.md`、`docs/architecture/move-map.json`。
- **Unresolved facts**：具体 schema 字段、当前函数锚点和 inventory 新增文件须在 build-code 前按任务卡核实；核实不到就 STOP，不得凭名称猜测。

### Global Constraints

- 四份材料是唯一当前工作真相；质量事实、review、inventory 和历史记录不能变成第二套推进账本。
- `make-decision`、`build-spec`、`build-plan`、`verify-code` 的 review 是异源建议；主 agent 必须评审每条 finding，不因建议事实开启无限循环。
- 本任务 build-code 的每个 Phase（P1—P5）额外声明 `phase_handoff_review: pass_required`：必须有实现、测试、`wh-review=pass` 和主 agent finding disposition 才能交接；这只影响当前任务的 Phase handoff，不创建公共 runtime gate、第二套状态机或新 ledger。
- verify-code 只允许一次架构检查、一次异源 review 和两批同任务修复；review、历史 replay、packet hash 和 audit 事实不得启动第三轮审查。
- `build-plan` 负责产品之外的工程方案和测试预判；`build-code` 读取预判、检查真实 changed files，必要时重新路由并调用具体 testing skill；缺策略写 `MATERIAL_INCOMPLETE` 并停止。
- 任何新增文件都必须有唯一 consumer、owner、测试和删除/保留条件；没有消费者不新增控制面。

## 3. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"d17c85373e30c4733a77b19dc260373268fca6dd29b8ac3574c8a35b4da6ebd5","id":"workflowhub-design-constitution","version":"1.5.0","clause_count":21}`
- **Checklist binding**：`constitution-checklist.md` SHA-256 `368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca`。
- **F1 薄核心**：阶段只调度和校验窄事实，复杂测试设计留在技能；不把业务逻辑塞进 runner。
- **F2 窄契约**：ArtifactDir、stage-skill invocation、review schema 和 test strategy 都是窄输入/输出。
- **F3 四材料/真实发布**：四份材料决定可工作；错误路径、hash、快照和发布结构 fail-loud。
- **F4 异源审查/人工判断**：非 build-code review 只提供建议；主 agent 评审 finding；serious finding 不阻止同任务修复。
- **F5 谨慎加 gate**：只增加已有真实失败对应的路径完整性、策略完整性和租约边界；不增加新总控门。
- **F6 外置记录**：调用事实、测试 receipt、provider attempt/result 继续写现有任务外置记录，不绑定永久 runner。
- **F7 正式确认/独立授权**：运行时仍区分正式确认与 commit/push/archive/cleanup 授权；本次用户已授权连续推进，不在普通阶段交接重复询问 confirmation。
- **F8 简单优先**：复用 ArtifactDir、TaskKernel、wh-review 和已有 testing skills，不建第二套材料或审查系统。
- **F9 不假绿**：未调用、unavailable、unknown、incomplete、测试失败和快照漂移都保留原状。
- **F10 自动化按收益**：新增测试只覆盖已发生的真实缺口；最终全量测试复用 `npm test`，不新增专用执行平台。
- **Q1 质量事实不作准入证**：缺 review 事实不阻止修复，但缺完整测试/逐 AC/交接不能宣称完成。
- **Q2 推进、发布、完成分离**：材料可读、正式写入真实、质量完成分别判断。
- **Q3 异源加人工**：本地执行事实不冒充 reviewer verdict；review provider 仍是独立来源。
- **S1 复用外部技能**：复用现有 spec、review 和 testing skills。
- **S2 合宪改造**：对现有技能只补调用顺序、输入输出和 advisory 语义，不照搬与宪法冲突的 pass 逻辑。
- **S3 就地检查更新**：本轮已参考 Spec Kit 和 Matt `to-spec`；外部来源写入 decision-log，不新增远程运行时依赖。
- **S4 指标统一**：新增 review lineage/metrics 复用现有 attempt/result 和 TaskKernel 事实。
- **S5 子代理友好**：技能仍通过独立 bundle/invocation 调用，主上下文只接收产物和摘要。
- **S6 参考成熟方案**：spec 结构参考 GitHub Spec Kit 与 Matt `to-spec`，不自创长实现规格。
- **S7 一阶段一技能/一工作流一文件夹**：不合并阶段技能，不新增跨阶段大技能；材料仍按 task 文件夹组织。
- **S8 可搬运**：任务卡依赖路径化输入和明确命令，不依赖本机隐含对话状态。

**Result**：21/21 条已在设计层处理；当前没有发现违反宪法的方案。正式实现后仍需由 `constitution-checklist.md` 对实际 diff 复核；这不是 build-code 进入门槛。

## 4. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Project rules | `CONSTITUTION.md`, `constitution-checklist.md` | no change | N/A | 只绑定 hash，不改宪法 |
| Workflow contracts | `runtime/stage/stage-context.mjs`, `runtime/stage/stage-handlers.mjs`, `tools/cli/stage-runtime.mjs`, `workflows/*/SKILL.md`, `workflows/*/skill-deps.yaml` | change | T001—T004 | 让材料路径和技能调用事实可回放 |
| Review contracts | `skills/wh-review/stage-skill-plan.json`, `skills/wh-review/manifest.json`, `runtime/stage/stage-skill-runtime.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/review/review-controller.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `tests/stage-review-cost-policy.test.mjs` | change | T003—T004 | 真 dispatch、单一 lens owner、review fact 与 serious finding 处置分开 |
| Schemas and events | `runtime/review/schemas/attempt.schema.json`, `runtime/review/schemas/result.schema.json` | change | T009—T010 | 保留 review request/prompt/round/prior lineage |
| Runtime configuration | `runtime/review/stage-materials.json` | change | T005—T006 | spec-analyze 能看到完整上游输入 |
| Knowledge and docs | `docs/adr/0009-stage-content-authority.md`, `docs/architecture/history-inventory.json`, `docs/architecture/repository-inventory.tsv`, `docs/architecture/retention-manifest.json` | change | T002、T011—T012 | 同步当前边界和组 8 登记事实 |
| Automation gates | `tests/contract/*.test.mjs`, `tests/integration/*.test.mjs`, `tests/official-component-receipts.test.mjs` | change | T001、T003、T005、T007、T009、T011 | 验证真实失败边界，不新增 gate 平台 |

## 5. Technical Decisions

### DEC-001 — make-decision 复用 ArtifactDir，不保留根目录材料

- **Problem**：当前 make-decision context 没有 ArtifactDir，导致决策质量证据和候选工作树根目录文件可能分裂。
- **Options**：A 继续根目录写文件；B 每个阶段各自拼路径；C 给 make-decision 注入现有 ArtifactDir，并把 quality evidence 作为不可变来源证据。
- **Selected**：C，`make-decision → decision-log.md` 只通过 `ctx.artifacts.writeAtomic`；根目录文件拒绝消费。
- **Reason**：只有一个当前材料 owner，保留现有 ArtifactDir 和 TaskKernel，不新增 writer。
- **Consequence / risk**：需要更新旧 ADR 和 make-decision 测试；quality evidence 与当前材料必须做 hash 绑定。
- **Fallback**：任何路径、task identity 或 hash 不一致都 fail-loud；不回退到根目录。

### DEC-002 — 独立 provider review 由 wh-review 单一 owner 调用

- **Problem**：阶段需要本地 planning advisory 和一次异源 provider review，重复调用会浪费 token。
- **Selected**：build-spec/build-plan 的 `simplicity-guard`、产品/工程 review 和 `spec-analyze` 由 stage-owned dispatcher 按固定顺序直接调用；`wh-review` 只负责最后一次独立 provider review，并读取前置事实。
- **Reason**：既证明必需技能真正参与，又避免把同一 lens 重复交给 provider 或建设第二套 review ledger。
- **Consequence / risk**：必须区分“stage skill 已调用”和“provider review 已调用”；测试防止重复 owner 和同一 snapshot 重复全量审查。

### DEC-003 — 测试路由预判，具体测试执行后置

- **Problem**：普通 build-code 模型若临场选测试层级或命令，会重新做工程判断。
- **Selected**：build-plan 只调用 `test-routing-advisor`，为每个 Phase 和最终 snapshot 预判 tier/expected concrete skill，tasks 保存完整 contract；build-code 看到真实 changed files 后必要时重路由，再调用 concrete testing skill 执行。
- **Reason**：高智力模型负责整体计划，具体测试技能等真实代码出现后再判断，避免空代码阶段的假设。
- **Consequence / risk**：遗漏字段或 concrete skill invocation 必须触发 `MATERIAL_INCOMPLETE`；实际范围变化必须保留预判和重路由事实。

### DEC-004 — review lineage 用显式对象保留，不覆盖历史 attempt

- **Problem**：组 7 当前数据有请求和重试的组成部分，但 schema 没有稳定的 request/prompt/round/prior 链。
- **Selected**：在现有 attempt/result 中加入兼容的 `lineage` 对象，并保留每次 attempt/result；失败分类保持原始码和映射。
- **Reason**：复用 review runner 已有的 request、round、previous runtime 和 correction 信息。
- **Consequence / risk**：旧记录读取要兼容缺失 lineage；新记录必须完整，指标按全部尝试聚合。

### DEC-005 — 组 8 只更新登记，不碰归档内容

- **Problem**：历史 inventory 与真实文件不一致。
- **Selected**：更新 inventory/retention 登记和校验测试；归档正文、历史运行时读取边界不改。
- **Reason**：解决真实登记失败而不污染历史。
- **Consequence / risk**：新增登记文件必须同步 hash；`verifyUnchanged` 失败就停止，不用“修正文”绕过。

## 6. Solution Design

### Overview

实现分六个 Phase。P1 先让当前材料落到正确目录；P2 固化基础阶段技能调用和 review 语义；P3 让 build-plan 的跨材料分析和测试策略成为完整合同；P4 处理组 6、7、8 的具体残留；P5 落实阶段顺序和真实测试路由；P6 把 verify-code 收窄为一次架构检查、一次异源 review 和两批修复。每个实现 Phase 都有 RED→GREEN，最后按当前快照执行一次最终测试和逐 AC 简短回放。

高智力模型只在 build-plan 设计：它先读决策/spec，按固定顺序调用 research、spec-plan、simplicity、engineering review、test-routing-advisor、spec-tasks、spec-analyze 和一次 wh-review；它为每个 Phase/最终测试写预判 tier 和 expected concrete skill，但不调用具体 testing skill。普通 build-code 读取预判、检查真实 changed files，必要时重路由，再调用 concrete testing skill，不发明产品需求或验收 oracle。

### Module responsibilities

#### Current material owner

- **Responsibility**：`ArtifactDir` 读写 `<worktree>/specs/<task>/` 四份材料。
- **Consumes**：stage context、task identity、artifact name、材料正文。
- **Produces**：受控 artifact、reference、hash。
- **Must not decide**：不判断 review 是否 pass，不创建第二份决策账本。

#### Stage skill invocation owner

- **Responsibility**：按 manifest 和 stage-skill-plan 调用技能并保存 invocation fact。
- **Consumes**：skill bundle、stage、invocation key、snapshot、host outcome。
- **Produces**：executed/not_invoked/unavailable/incomplete fact。
- **Must not decide**：不把 skill invocation 自动变成质量 pass。

#### Build-plan test designer

- **Responsibility**：给每个 Phase 和最终 full test 预判 tier、expected concrete skill、场景、命令、oracle、证据和限制；不调用 concrete testing skill 或 testing-system-blueprint。
- **Consumes**：spec、plan anchors、当前测试工具和真实代码边界。
- **Produces**：plan/tasks 的 `test_strategy`。
- **Must not decide**：不在 build-plan 执行测试，不新增产品范围。

#### Build-code executor

- **Responsibility**：按任务卡顺序改文件，检查真实 changed files，必要时重新调用 test-routing-advisor，再调用 concrete testing skill、执行测试并回填事实。
- **Consumes**：四份材料、task facts、task cards。
- **Produces**：代码 diff、测试输出、canonical receipt、AC evidence。
- **Must not decide**：不改产品 scope、不改验收 oracle、不把失败改为成功；只有真实范围变化时按规则重新路由测试。

### Conditional contracts

- **UI**：N/A；本任务没有产品页面，浏览器路线和 frontend-testing 均不适用。
- **External code**：N/A；不修改第三方依赖或 vendor。
- **History**：`specs/archive/`、`docs/architecture/legacy-*` 和归档正文只读；登记工具只能读并更新登记文件。

## 7. Data Model and Lifecycle

- 当前材料状态：`draft → accepted_for_build → implemented → verified`；材料缺失、路径错或 hash 不一致为 `incomplete`，不自动修复。
- 技能事实状态：`executed`、`not_invoked`、`unavailable`、`incomplete`；required skill 缺失不能被材料存在掩盖。
- review 状态：保留 provider 原始 `semantic`、`unavailable`、`invalid_evidence`、`timeout` 和 findings；非 build-code 是 advisory；build-code 缺 review fact、测试/AC 证据或 serious finding 处置时不能宣称实现交付，不把 verdict `pass` 当继续工作的 gate。
- 测试状态：`planned → red → green`；输出、receipt、snapshot 和 AC evidence 绑定同一当前快照。
- 组 6 状态：baseline、phase order、evidence、failure attribution、test lease 各自可判断；任一缺失为 unknown/incomplete。
- 组 7 状态：每个 attempt/result 独立保存；lineage 指向 request/prompt/round/prior/correction；聚合指标包含所有尝试。
- 组 8 状态：inventory/retention 登记与真实仓库一致；归档正文 hash unchanged；运行时无历史消费。

## 8. API Contract

没有新的公共 API。内部调用合同如下：

- `ArtifactDir.writeAtomic(name, content)`：只允许当前阶段声明的 artifact name；写入失败必须抛错。
- `invoke-stage-skill`：required skill 返回一条 host outcome；`triggered=false` 必须有具体 reason；没有事实则保持 incomplete。
- `captureTests({ command, receiptRef, outputRef })`：获取有限等待的 test-capture lease；超时、崩溃、快照漂移和释放失败都保留失败事实。
- review attempt/result：新记录必须保留 `request/prompt/round/prior` lineage；历史旧记录只读保留，不纳入新的 current-subject replay，缺 lineage 的旧记录不能作为当前 review 证据。
- inventory：`capture-before` 与 `verify-unchanged` 只操作登记文件；归档内容变化必须报错。

## 9. File Boundary

### NEW

- `tests/contract/make-decision-artifact-path.test.mjs`
- `tests/contract/stage-skill-invocation-contract.test.mjs`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- `tests/contract/stage-routing-and-concrete-testing.test.mjs`

### MODIFY

- `runtime/stage/stage-context.mjs`
- `runtime/stage/stage-handlers.mjs`
- `tools/cli/stage-runtime.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-skill-runtime.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/schemas/stage-skill-deps.schema.json`
- `runtime/evidence/check-skill-closure.mjs`
- `runtime/review/review-controller.mjs`
- `runtime/evidence/stage-completion-facts.mjs`
- `runtime/evidence/canonical-receipt-writer.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/review/stage-materials.json`
- `runtime/review/schemas/attempt.schema.json`
- `runtime/review/schemas/result.schema.json`
- `skills/spec-analyze/SKILL.md`
- `skills/wh-review/stage-skill-plan.json`
- `skills/wh-review/manifest.json`
- `skills/reuse-registry.md`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `skills/wh-review/scripts/review-result.mjs`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-spec/steps.json`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-plan/steps.json`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/skill-deps.yaml`
- `workflows/build-code/steps.json`
- `skills/simplicity-guard/SKILL.md`
- `skills/plan-ceo-review/SKILL.md`
- `skills/plan-design-review/SKILL.md`
- `skills/plan-eng-review/SKILL.md`
- `skills/test-routing-advisor/SKILL.md`
- `skills/backend-testing/SKILL.md`
- `skills/frontend-testing/SKILL.md`
- `skills/fullstack-slice-testing/SKILL.md`
- `skills/testing-system-blueprint/SKILL.md`
- `tools/cli/smoke-local-skill-dispatch.mjs`
- `docs/adr/0009-stage-content-authority.md`
- `docs/architecture/history-inventory.json`
- `docs/architecture/repository-inventory.tsv`
- `docs/architecture/retention-manifest.json`
- `tests/contract/material-workspace.test.mjs`
- `tests/contract/build-code-apply-contract.test.mjs`
- `tests/contract/review-controller-retry-policy.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/stage-completion-facts.test.mjs`
- `core/__tests__/stage-skill-runtime.test.mjs`
- `core/__tests__/check-skill-closure.test.mjs`
- `tests/stage-plan-task-contract.test.mjs`
- `tests/contract/spec-stage-artifact-closure.test.mjs`
- `tests/stage-review-cost-policy.test.mjs`
- `tests/official-component-receipts.test.mjs`
- `tests/integration/history-read-only.test.mjs`
- `tests/integration/governance-diagnostics-non-gate.test.mjs`

### DO NOT TOUCH

- `CONSTITUTION.md`
- `constitution-checklist.md`
- `CONTEXT.md`
- `runtime/task/task-handle.mjs`（除非 RED 明确证明现有记录锁契约不足；默认只在 receipt writer 调整等待语义）
- `specs/archive/**`
- `docs/architecture/legacy-**`
- `node_modules/**`

## 10. Data Flow and Integration

```text
原始需求/R-IDs → decision-log → readable spec → plan/tasks test_strategy → build-code facts/receipts → verify-code architect assessment → one independent review → final handoff
                                      ↓
                       review-materials + spec-analyze consistency report
```

- **Existing modules**：`ArtifactDir` 管当前材料；`TaskKernel` 管任务和事实；stage skill runtime 管 invocation；`wh-review` 管异源 review；architecture tools 管历史登记。
- **Integration points**：make-decision context 注入 `ArtifactDir`；build-plan packet 增加 decision source index；review schema 增加 lineage；receipt writer 增加有限 lease 事实。
- **Compatibility boundaries**：历史记录只读；旧 attempt/result 缺 lineage 时可读取但新记录完整；公共 runtime 入口不增加新命令。
- **Fail-loud behavior**：路径错、技能事实缺失、策略字段缺失、schema 不完整、lease 超时、归档变化和快照漂移明确失败，不通过兜底逻辑遮盖。

## 11. Code Anchors and Reuse

- **Spec binding**：`{"artifact_kind":"spec","ref":"specs/multica-issues-monitoring-g6-g7-20260805/spec.md","hash":"9c2875d5f28afa77b23a4d4865efb246703b91b0c00e0eb7b9e91883e2ac011b","id":"multica-issues-monitoring-g6-g7-20260805-spec"}`
- **read_now**：`core/artifact-dir.mjs:ArtifactDir`、`runtime/stage/stage-context.mjs:prepareMakeDecisionWorkspace`、`tools/cli/stage-runtime.mjs:DESIGN_ARTIFACTS`、`runtime/stage/stage-handlers.mjs:make-decision/build-plan handlers`、`runtime/evidence/stage-completion-facts.mjs`、`runtime/review/stage-materials.json`、`skills/wh-review/stage-skill-plan.json`。
- **must_read_before_task**：每张任务卡列出的 source anchor、对应 schema、现有测试 fixture 和 constitution binding；读不到就 STOP。
- **Context mode**：Full for build-plan; build-code uses task-local Lite context plus exact anchors and commands.

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
| --- | --- | --- | --- | --- |
| A-001 | `core/artifact-dir.mjs:ArtifactDir.open/writeAtomic/read/reference` | 受控材料路径和 hash | 扩展 make-decision consumer | 不新增 writer |
| A-002 | `runtime/stage/stage-context.mjs:prepareMakeDecisionWorkspace` | 准备 make-decision candidate | 注入 ArtifactDir | 不改 task identity |
| A-003 | `tools/cli/stage-runtime.mjs:DESIGN_ARTIFACTS/artifact` | build-spec/build-plan artifact 写入 | 增加 decision-log 合法 artifact | 不接受根目录 fallback |
| A-004 | `runtime/evidence/stage-completion-facts.mjs` | 从 invocation 事实推导缺失 | required skill incomplete | 不把缺事实改成 pass |
| A-005 | `skills/wh-review/stage-skill-plan.json` | stage review lens 选择 | 固化一次性 lens 顺序 | 不新增第二个 review owner |
| A-006 | `runtime/review/schemas/attempt.schema.json` / `result.schema.json` | review 事实结构 | 加 lineage | 不覆盖历史记录 |
| A-007 | `runtime/evidence/canonical-receipt-writer.mjs:captureTests` | 测试命令和 canonical receipt | 加有限 lease 和释放事实 | 不吞掉命令失败 |
| A-008 | `tools/architecture/history-inventory.mjs` / `retention-audit.mjs` | 历史登记和只读校验 | 更新登记事实 | 不修改归档正文 |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
| --- | --- | --- | --- |
| 当前材料 | extend | `ArtifactDir` | 只有一个 owner |
| 技能事实 | extend | stage skill runtime/TaskKernel | 不建第二账本 |
| review lens | extend | `wh-review/stage-skill-plan.json` | 继续单一 provider owner |
| 测试路由 | reuse | `test-routing-advisor`；具体 testing skill 在 build-code 调用 | 高智力预判、普通模型按真实范围执行 |
| review lineage | extend | review runner 已有 request/round/prior 信息 | 保留历史、补 schema |
| 组 8 登记 | extend | history-inventory/retention-audit | 不让历史进入 runtime |
| 新控制面 | remove | N/A | 不新增 |

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
| --- | --- | --- | --- |
| SIG-001 | Artifact | `writeAtomic(name, content)` / `read(name)` / `reference(name)` | A-001 |
| SIG-002 | Skill invocation | `invoke-stage-skill --name --invocation-key [--triggered --reason]` | A-003/A-004 |
| SIG-003 | Test receipt | `captureTests({command, receiptRef, outputRef})` | A-007 |
| SIG-004 | History check | `captureBefore({root, baseline})` / `verifyUnchanged({root})` | A-008 |

查不到真实签名、schema 或 fixture 时，任务必须回到 build-plan 修正，不能在 build-code 猜测。

## 12. Rollback and Recovery

- **Global recovery rule**：保留 accepted 的 decision/spec/plan/tasks 和原始 quality facts，只恢复当前实现代码或登记文件；不删除历史证据。
- **Irreversible boundaries**：commit、push、merge、archive、cleanup 需要独立 `authorize`；本计划不授权这些动作。
- **Recovery owner**：build-code 执行者只负责当前 Phase；verify-code 负责独立复跑；发现 scope drift 由主 agent 回到 make-decision。

### Engineering Risk Handoff

- **PLAN-RISK-001**：make-decision 双写造成两份真相。Affected: FR-WH-003/AC-WH-03；触发：ArtifactDir 和 quality evidence hash 不同；处理：STOP，修 writer/handler，不接受复制修复。
- **PLAN-RISK-002**：高智力计划漏测试合同。Affected: FR-WH-006/AC-WH-06；触发：Phase/task 缺 tier、skill、command、oracle 或 evidence；处理：标 `MATERIAL_INCOMPLETE`，回 build-plan。
- **PLAN-RISK-003**：review finding 被机械采纳。Affected: FR-WH-005/AC-WH-05；触发：非 build-code review 要求 pass 或无主 agent disposition；处理：保留原 finding，补处置事实，不重复全量 review。
- **PLAN-RISK-006**：build-code Phase 缺 review/证据或 serious finding 未处置仍被宣称完成。Affected: FR-WH-008/AC-WH-08；触发：review unavailable、invalid evidence 或 serious finding 未处置；处理：保持 completion `incomplete`，同一任务修复或取得具体风险接受，不为追求 pass 无限复审。
- **PLAN-RISK-004**：组 7 lineage 兼容失败。Affected: FR-G7-001—003/AC-G7；触发：旧记录读取失败或新 attempt 缺字段；处理：先加兼容读取和 RED fixture，再发布 schema。
- **PLAN-RISK-005**：组 8 登记修改了归档。Affected: FR-G8-002/AC-G8；触发：archive hash 变化；处理：立即 STOP，恢复当前登记改动，不触碰归档正文。

## 13. Test Strategy

### Test-routing-advisor 结果

| Target | Tier | Concrete skill | Why |
| --- | --- | --- | --- |
| P1 受控材料/skill invocation | feature | `backend-testing` | 跨 CLI、stage context、TaskKernel contract，无页面 |
| P2 review advisory/调用闭环 | feature | `backend-testing` | 运行时状态和阶段事实，无 UI |
| P3 spec-analyze/plan-task contract | feature | `backend-testing` | 多材料输入输出和结构验证，无外部服务 |
| P4 组 6/7/8 residual closure | fullstack | `fullstack-slice-testing` | review/provider/receipt/concurrency/inventory 横跨多个运行边界 |
| 最终完整测试 | fullstack | `fullstack-slice-testing` | 当前快照上的全工作流、质量事实、历史只读和交接回放 |

`frontend-testing` 不调用：没有产品页面、浏览器路线或 UI 状态。`simple` 不足以覆盖本任务的跨模块事实链；若 build-code 发现某个孤立测试可降为 simple，只能作为已设计命令的局部执行优化，不能改写 Phase tier。

### build-plan 调用顺序

1. `spec-research`：只做必要的事实确认，产出研究摘要，不写第二份需求。
2. `spec-plan`：根据真实 anchors 形成 Phase、文件边界、依赖、回滚和 RED/GREEN。
3. `simplicity-guard`：检查能否删除、复用或缩小。
4. `plan-eng-review`：检查工程边界、依赖、失败路径、回滚和验证方式。
5. `test-routing-advisor`：对每个 Phase 和最终全量测试分别给 tier 和 expected concrete skill。
6. `spec-tasks`：把上述结果落成一张任务卡一项行为。
7. `spec-analyze`：检查原始需求→decision-log→spec→plan→tasks→FR/AC/test 是否全覆盖；report-only。
8. `wh-review`：对冻结的 plan/tasks 一次性收集异源建议；主 agent 逐条判断 finding。

本阶段不调用 `testing-system-blueprint`、`backend-testing`、
`frontend-testing` 或 `fullstack-slice-testing`；这些技能等 build-code 有真实
changed files 后才调用。

### Execution contract

- build-plan 不执行 `npx vitest`、`npm test` 或真实 provider test；只写设计。
- build-code 按 tasks 顺序执行已记录命令；命令、tier、skill、oracle 或 evidence 缺任何一项都报 `MATERIAL_INCOMPLETE` 并 STOP。
- RED 和 GREEN 使用相同 `gate_cmd` 与 oracle ID；RED 预期非零，GREEN 预期 0。
- evidence 必须绑定当前 snapshot、实际 exit code 和 canonical receipt；`display_cmd` 不能充当判据。
- verify-code 只独立复跑已设计路径，并给逐 AC 结论；不重新设计测试。

## 14. Implementation Order

```text
P1 current material → P2 skill/review semantics → P3 cross-material analysis/test contract → P4 G6/G7/G8 residuals → P5 D-015 routing contract → P6 bounded verify acceptance → final current-snapshot aggregate
```

- P1 必须先完成，因为之后所有阶段都要从 ArtifactDir 读四份材料。
- P2 依赖 P1 的 invocation fact 和 material identity；否则审查事实无法绑定当前材料。
- P3 依赖 P1/P2 的输入和技能调用；否则 spec-analyze 仍会看不全，普通模型也没有执行合同。
- P4 依赖 P3 的文件边界和测试策略；组 6/7/8 的实现不能反过来改变产品范围。
- P5 依赖 P4 的历史事实和当前四份材料；它只修正阶段调用顺序、测试路由时机和 verify 反向回放，不重写 P1—P4 代码事实。
- P4 内部：G6 的 receipt/phase facts 先于 G7 review schema；G8 inventory 最后执行，因为它必须在实现文件稳定后更新登记。

## 15. Phases

### Phase P1：受控当前材料与 Grill/技能事实边界

#### Goal

make-decision 能把 decision-log 写入 `specs/<task>/`，后续阶段只读同一 ArtifactDir；required skill 缺失保持 incomplete；用户可见 Grill 仍由主 agent 完成，不新增对话状态机。

#### Files

- **NEW**：`tests/contract/make-decision-artifact-path.test.mjs`
- **MODIFY**：`runtime/stage/stage-context.mjs`、`runtime/stage/stage-handlers.mjs`、`tools/cli/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`docs/adr/0009-stage-content-authority.md`、`tests/contract/material-workspace.test.mjs`
- **REUSED BASELINE TEST**：`tests/contract/stage-decision-contract.test.mjs` 只作为回归输入运行，不宣称本 Phase 修改了它。
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`specs/archive/**`

#### Tasks

- T001 RED：证明 make-decision 当前不能把 decision-log 作为受控 ArtifactDir 材料发布。
- T002 GREEN：注入 ArtifactDir、开放受控 decision-log artifact、校验质量 evidence 与当前材料一致，并同步 skill/ADR。

#### Verify

`npx vitest run tests/contract/make-decision-artifact-path.test.mjs tests/contract/material-workspace.test.mjs tests/contract/stage-decision-contract.test.mjs`；RED 非零、GREEN 0；oracle `ORACLE-P1-ARTIFACT-001`。

#### Knowledge

`ArtifactDir.open`、`prepareMakeDecisionWorkspace`、`DESIGN_ARTIFACTS` 和 make-decision handler 已核实；Grill 沟通本身用人工回放，不伪造机器交互事实。

#### STOP

如果需要根目录 fallback、第二份 writer、改变 task identity 或改宪法，停止并回 make-decision/架构决策。

#### Done

受控路径测试 GREEN；根目录同名文件不被消费；质量 evidence 仍保留为不可变来源，不成为第二份当前材料。

#### Risks and rollback

路径改动可能影响旧 fixture；保留 fixture 的历史语义，按当前 ArtifactDir contract 更新测试，不删除历史证据。

### Phase P2：阶段技能调用和 review advisory 语义

#### Goal

P2 先固化基础 stage dispatch、owner/dispatch 字段和 review advisory 语义；D-015 的直接 planning skill 顺序、build-code concrete testing skill 和实际范围重路由由 P5 scope revision 完成。非 build-code review 是建议，build-code review fact 与 serious finding 处置必须保留；普通快照变化不自动触发全量复审。

#### Files

- **NEW**：`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/review-controller-retry-policy.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/schemas/stage-skill-deps.schema.json`、`runtime/evidence/stage-completion-facts.mjs`、`runtime/evidence/check-skill-closure.mjs`、`runtime/review/review-controller.mjs`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/manifest.json`、`skills/reuse-registry.md`、`skills/wh-review/scripts/wh-review-cli.mjs`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-spec/steps.json`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-plan/steps.json`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`tools/cli/stage-runtime.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/contract/build-code-apply-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`core/__tests__/stage-skill-runtime.test.mjs`、`core/__tests__/check-skill-closure.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`runtime/task/task-handle.mjs`

#### Tasks

- T003 RED：证明声明的 required skill 缺 invocation fact、delegated lens 被当成独立组件、或同一 snapshot 被重复全量 review 时，当前合同不能清楚表达 incomplete/advisory。
- T004 GREEN：固化 stage 调用顺序、wh-review lens 单一 owner、非 code advisory 和 build-code finding disposition 语义。

#### Verify

`npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/stage-review-cost-policy.test.mjs tests/contract/build-code-apply-contract.test.mjs`；oracle `ORACLE-P2-SKILL-REVIEW-001`。

#### Knowledge

`stage-skill-plan.json` 已有 review lens；`stage-completion-facts.mjs` 已有 missing/conditional 语义；`runOfficialStage` 当前不会自动 dispatch，需用现有 dispatcher/host bridge 补闭环，不新建 ledger。

#### STOP

如果实现要求把 advisory finding 变成 build-spec/build-plan/verify-code pass gate，或要求重复审同一未变 snapshot，停止并回 D-008/D-009 评审。

#### Done

P2 历史快照曾记录 delegated lens 和 build-plan concrete testing design；D-015/P5 已 supersede 该调用时机。当前合同要求每个 required stage skill 有真实 executed/not_invoked/unavailable/incomplete 事实；wh-review 只做独立 provider review；build-code 缺 review/测试/AC 或 serious finding disposition 才影响完成结论；普通快照变化不自动触发全量 review。

#### Risks and rollback

调用顺序变更可能影响旧 baseline fixture；保留原始 invocation facts，更新当前 contract fixture，不改历史记录。

### Phase P3：跨材料一致性与可执行测试合同

#### Goal

spec-analyze 能读取原始需求索引、decision-log、spec、plan、tasks，检查遗漏/矛盾/孤儿 task/AC 无测试；plan/tasks 为每个 Phase、每个 task 和最终全量测试保存完整策略。

#### Files

- **NEW**：`tests/contract/spec-analyze-completeness.test.mjs`
- **MODIFY**：`runtime/review/stage-materials.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/spec-analyze/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`specs/archive/**`、`runtime/review/schemas/attempt.schema.json`

#### Tasks

- T005 RED：用缺 FR、缺原始 R、孤儿 task、缺 tier/skill/oracle/evidence 的 fixture 证明分析和 plan-task contract 能报问题。
- T006 GREEN：把原始需求 source index 接入 build-plan packet，扩展 spec-analyze 和 test_strategy contract；finding 只报告，主 agent 逐条处置。

#### Verify

`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs`；oracle `ORACLE-P3-COVERAGE-001`。

#### Knowledge

原始需求以 decision-log 的 R-001—R-011 为当前 source index；不新增 raw requirement ledger。D-015 已明确不在本标准链调用 `testing-system-blueprint`，tasks 保存 test-routing-advisor 的预判和 concrete skill 目标。

#### STOP

如果发现产品选择不在 D-001—D-016、spec 需要新增行为，停止回 make-decision；如果只有 review finding 没有证据，主 agent 评审后保留 unknown，不机械扩 scope。

#### Done

每个 FR/AC 双向追到 task/test/evidence；每个 task 有 source_refs；每个 Phase/最终测试有 tier、具体 skill、场景、命令、退出码、oracle、fixture、证据和覆盖限制。

#### Risks and rollback

分析 packet 扩展可能误把 derived report 当当前材料；只新增输入索引，不新增持久完成账本，失败时回滚 packet 投影即可。

### Phase P4：组 6、7、8 残留闭环

#### Goal

补齐组 6 的 baseline/phase evidence/failure attribution/test lease，组 7 的 lineage/failure taxonomy/all-attempt metrics，组 8 的登记校验，同时保持历史只读。

#### Files

- **NEW**：`tests/contract/review-lineage-taxonomy-metrics.test.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-provider-client.mjs`、`tools/architecture/history-inventory.mjs`、`tools/architecture/retention-audit.mjs`、`docs/architecture/history-inventory.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/retention-manifest.json`、`tests/official-component-receipts.test.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`specs/archive/**`、`docs/architecture/legacy-**`、`runtime/task/task-handle.mjs`（除非 T007 RED 证明 owner/expiry 不能满足 lease contract）

#### Tasks

- T007 RED：证明测试 capture lease、baseline 区分、阶段证据顺序或失败归因在并发/失败/漂移时存在假成功风险。
- T008 GREEN：增加有限等待、明确超时/释放事实，并把两类 baseline、phase evidence、failure attribution 绑定到当前 snapshot。
- T009 RED：证明 review attempt/result 丢 request/prompt/round/prior/correction、失败分类不一致或只聚合最后一次尝试。
- T010 GREEN：补显式 lineage、稳定 failure taxonomy 映射和全量 attempt/retry/correction metrics，同时兼容旧记录。
- T011 RED：用新增/缺失/变化的历史登记 fixture 证明 inventory/retention 差异和 archive mutation 能被识别。
- T012 GREEN：更新组 8 登记和只读校验；归档正文 hash 保持不变，运行时不读取历史 inventory。

#### Verify

`npx vitest run tests/official-component-receipts.test.mjs tests/contract/review-lineage-taxonomy-metrics.test.mjs tests/integration/history-read-only.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs`；oracle `ORACLE-P4-RESIDUAL-001`。

#### Knowledge

`canonical-receipt-writer.mjs:captureTests`、review runner 已有 request/round/prior 组成部分、history-inventory/retention-audit 已有只读检查；build-code 先读真实 schema 和 fixture 再改。

#### STOP

lease 无法有限失败、归档正文 hash 变化、旧记录不可读、失败类型被重试覆盖、或需要新增旧 control plane 时停止。

#### Done

G6/G7/G8 的每个 AC 有 test/evidence；所有 provider attempt 保留；登记与真实仓库一致；历史正文和 runtime history boundary 未变。

#### Risks and rollback

schema/metrics 改动有兼容风险；先发布 RED fixture，再 GREEN；发现旧记录读取破坏时只回滚新字段解析，不删除历史 attempt/result。

### Phase P5：D-015 阶段顺序与真实测试路由 scope revision

#### Goal

把用户最新确认的技能调用顺序、build-plan 设计边界、build-code 实际测试路由和 verify-code 反向回放写成可执行合同；不覆盖 P1—P4 的历史事实。

#### Files

- **NEW**：`tests/contract/stage-routing-and-concrete-testing.test.mjs`
- **MODIFY**：`specs/multica-issues-monitoring-g6-g7-20260805/decision-log.md`、`specs/multica-issues-monitoring-g6-g7-20260805/spec.md`、`specs/multica-issues-monitoring-g6-g7-20260805/plan.md`、`specs/multica-issues-monitoring-g6-g7-20260805/tasks.md`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/review-runner.mjs`、`workflows/make-decision/steps.json`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-spec/steps.json`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-plan/steps.json`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/build-code/steps.json`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/manifest.json`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/reuse-registry.md`、`skills/catalog.yaml`、`skills/simplicity-guard/SKILL.md`、`skills/plan-eng-review/SKILL.md`、`skills/test-routing-advisor/SKILL.md`、`skills/backend-testing/SKILL.md`、`skills/frontend-testing/SKILL.md`、`skills/fullstack-slice-testing/SKILL.md`、`skills/testing-system-blueprint/SKILL.md`
- **DO NOT TOUCH**：`CONSTITUTION.md`、`constitution-checklist.md`、`specs/archive/**`、`runtime/task/task-handle.mjs`
- **同步事实文件**：`skills/catalog.yaml`、`skills/wh-review/skill-bundle.json`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-tasks/skill-bundle.json`、`skills/test-routing-advisor/skill-bundle.json`、`skills/testing-system-blueprint/skill-bundle.json`、`skills/backend-testing/skill-bundle.json`、`skills/frontend-testing/skill-bundle.json`、`skills/fullstack-slice-testing/skill-bundle.json`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/build-code-apply-contract.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`

#### T013 — RED：最新阶段顺序和测试时机合同

- **ID**：T013
- **Phase**：P5
- **goal**：证明旧合同仍会把 planning lens 当 delegated provider、把 blueprint/concrete testing skill 放进 build-plan，或让 build-code 不检查真实范围。
- **design_state**：ready
- **versioned_refs**：与 `tasks.md` 头部和 T001 相同；P5 变更前的 review snapshot/material hash 保留在外置 review 事实中。
- **source_refs / decision_refs**：`R-011 → D-015 → FR-WH-009、FR-WH-010 → AC-WH-09、AC-WH-10`
- **输入**：阶段 skill-deps、steps、wh-review stage plan、四份当前材料和 concrete testing skill 文档。
- **依赖**：T012
- **并行**：否 — 必须先冻结 D-015 的 scope revision。
- **FR**：FR-WH-009、FR-WH-010
- **AC**：AC-WH-09、AC-WH-10
- **动作**：新增顺序/owner/具体测试时机断言；不先修合同。
- **精确文件**：`tests/contract/stage-routing-and-concrete-testing.test.mjs`
- **execution_file_paths**：`["tests/contract/stage-routing-and-concrete-testing.test.mjs"]`
- **boundary**：只新增 fixture/assertion；不改运行时和历史记录。
- **输出**：RED 必须具体指出调用顺序、build-plan 禁止项、build-code routing 或 verify reverse-check 缺口。
- **Knowledge**：stage-owned 依赖按 YAML 顺序 dispatch；wh-review 只负责独立 review；具体 testing skill 需等真实 changed files。
- **verification_role**：RED；**paired_task**：T014
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：build-spec 顺序和 UI 条件；build-plan research skipped、顺序和禁止技能；build-code route/re-route/concrete skill；verify 原始需求/Design/完整流程/unknown。
- **gate_cmd**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs`
- **expected_exit**：非零整数
- **oracle**：`ORACLE-P5-STAGE-ROUTING-001`；失败必须指向具体文件/顺序/技能。
- **fixtures_services**：本地 YAML/JSON/Markdown fixture；不调用真实 provider，不启动浏览器。
- **browser_route**：N/A — 当前任务无 UI。
- **evidence_path**：`quality/tests/p5/t013-red.json`、`quality/tests/output/p5/t013-red/`
- **coverage limits**：不证明实际 stage runner 已执行 provider；只证明合同可回放。
- **STOP**：若只能通过重复 review、新增 ledger 或放宽具体技能时机才能通过，停止并回主 agent。
- **recovery**：保留 RED，修正当前四份材料/阶段合同，不改历史 P1—P4 receipt。

#### T014 — GREEN：落地 D-015 并闭合当前材料

- **ID**：T014
- **Phase**：P5
- **goal**：让 T013 通过，且普通 build-code 能按预判执行、按实际范围重新路由并调用具体 testing skill。
- **design_state**：ready
- **versioned_refs**：同 T013；GREEN receipt 必须绑定 P5 当前 snapshot。
- **source_refs / decision_refs**：`R-011 → D-015 → FR-WH-009、FR-WH-010 → AC-WH-09、AC-WH-10`
- **输入**：T013 RED；D-015、四份材料、阶段技能合同。
- **依赖**：T013
- **并行**：否 — 先完成材料，再完成 stage contract。
- **FR**：FR-WH-009、FR-WH-010
- **AC**：AC-WH-09、AC-WH-10
- **动作**：更新当前四份材料、阶段依赖和步骤、wh-review 独立 owner、planning/testing skill 文档及契约测试；不调用 testing-system-blueprint。
- **精确文件**：同 P5 Files；`CONSTITUTION.md`、archive、task-handle 除外。
- **execution_file_paths**：同 P5 Files 中除 `CONSTITUTION.md`、archive、task-handle 的全部当前变更文件。
- **boundary**：只实现 D-015；不增加公共 stage、ledger、provider owner 或历史控制面。
- **输出**：阶段 invocation order 可回放；build-plan 禁止具体 testing skill；build-code 具备 route/re-route/concrete testing skill；verify reverse-check 明确 unknown 语义。
- **Knowledge**：P1—P4 历史事实不可重写；当前材料变化会使旧 review/test snapshot stale，必须采集 P5 新事实。
- **verification_role**：GREEN；**paired_task**：T013
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`feature` / `backend-testing`
- **scenarios**：同 T013，且检查每个 expected skill bundle/owner/dispatch 合法。
- **gate_cmd**：`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/contract/review-lineage-taxonomy-metrics.test.mjs tests/stage-review-cost-policy.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-P5-STAGE-ROUTING-001`；P5 合同、顺序、禁止项和 concrete testing routing 全通过。
- **fixtures_services**：同 T013；测试后清理临时 fixture。
- **browser_route**：N/A
- **evidence_path**：`quality/tests/p5/t014-green.json`、`quality/tests/output/p5/t014-green/`
- **coverage limits**：不把合同测试当成真实第三方 provider 可用；provider unavailable 仍保留原事实。
- **STOP**：阶段 owner 重复、build-plan 偷调具体 testing skill、build-code 缺 concrete skill invocation、或 verify 缺 unknown 分支时停止。
- **recovery**：回滚 P5 当前合同/文档改动；保留 T013 和原始 P1—P4 事实。

#### Verify

`npx vitest run tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/stage-skill-invocation-contract.test.mjs tests/contract/review-controller-retry-policy.test.mjs tests/contract/review-lineage-taxonomy-metrics.test.mjs tests/stage-review-cost-policy.test.mjs`；oracle `ORACLE-P5-STAGE-ROUTING-001`。

#### Phase review / handoff

P5 必须执行一轮当前快照 `wh-review`；主 agent 逐条判断 finding，修复确有影响的问题或记录具体延期/风险处置，然后进入最终完整测试。P5 的 review 不覆盖或改写 P1—P4 历史 review，也不为取得 `pass` 无限重审。

## 16. Dependencies and Parallelism

- **依赖图**：`P1 → P2 → P3 → P4 → P5 → final aggregate`。
- P1 内 T001→T002；P2 内 T003→T004；P3 内 T005→T006；P4 内 T007→T008、T009→T010、T011→T012。
- P4 的 G6、G7 可以在各自 RED 完成后并行设计，但实际 GREEN 仍按 tasks 文件顺序执行，且 G8 必须最后更新登记。
- 不并行修改同一 schema、review runner、inventory 文件或当前材料；避免 producer-consumer 反转和 snapshot 混用。

## Phase P6：verify-code 架构师验收

### 目标

把 verify-code 从“证据/审计收集器”改成一次有限的资深架构师验收。主 agent 先看完整
需求、流程、架构和实现并修一批；`wh-review` 只做一次异源复核；主 agent 最后修一批，
然后做最终测试和大白话交接。

### 设计

- 主 agent 使用本机 `code-review` 的 Spec/Standards 两条线和 `codebase-design` 的
  module/interface/seam/depth/locality 方法；不产生额外 ledger。
- WorkflowHub 只保留一次 `wh-review`，provider 读取 AC、架构师短报告、最终测试摘要和
  未决风险；不再要求完整 requirement replay、evidence tree、context/evidence map。
- 现有 `verification.json` 可附带 `review_cycle` 四步摘要；它是交接说明，不是第二套状态机。
- 最终结论分 `passed`、`failed`、`incomplete`；review unavailable、测试 timeout 和缺
  evidence 都如实保留，不开启第三次审查。

### 交付与测试

- **T015 RED**：验证旧合同会诱导重复审查和大 evidence packet。
- **T016 GREEN**：验证新 steps、材料 allowlist、review-cycle receipt 和一次性 provider 合同。
- **测试层级**：`feature` / `backend-testing`；命令和 oracle 见 `tasks.md`。
- **范围**：只改 verify-code 合同和现有 receipt/material 兼容入口；不新增公共命令、ledger、
  recovery、successor 或 close gate。

## 17. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-G6-001—004 | T007—T008 | AC-G6 | P4 | `ORACLE-P4-RESIDUAL-001` / `quality/tests/p4-g6` |
| FR-G7-001—003 | T009—T010 | AC-G7 | P4 | `ORACLE-P4-RESIDUAL-001` / `quality/tests/p4-g7` |
| FR-G8-001—002 | T011—T012 | AC-G8 | P4 | `ORACLE-P4-RESIDUAL-001` / `quality/tests/p4-g8` |
| FR-WH-001—003 | T001—T002 | AC-WH-01—03 | P1 | `ORACLE-P1-ARTIFACT-001` / `quality/tests/p1` |
| FR-WH-002 | T003—T004 | AC-WH-02 | P2 | `ORACLE-P2-SKILL-REVIEW-001` / `quality/tests/p2` |
| FR-WH-005 | T003—T004 | AC-WH-05 | P2 | `ORACLE-P2-SKILL-REVIEW-001` / `quality/tests/p2` |
| FR-WH-004 | T005—T006 | AC-WH-04 | P3 | `ORACLE-P3-COVERAGE-001` / `quality/tests/p3` |
| FR-WH-007 | T005—T006 | AC-WH-07 | P3 | `ORACLE-P3-COVERAGE-001` / `quality/tests/p3` |
| FR-WH-006 | T005—T006 | AC-WH-06 | P3 | `ORACLE-P3-COVERAGE-001` + final aggregate |
| FR-WH-008 | T002、T004、T006、T008、T010、T012、T014 | AC-WH-08 | P1—P5 | phase review fact + disposition + handoff evidence |
| FR-WH-009 | T013—T014 | AC-WH-09 | P5 | `ORACLE-P5-STAGE-ROUTING-001` / quality/tests/p5 |
| FR-WH-010 | T013—T014、FINAL、verify-code | AC-WH-10 | P5 + FINAL + verify | routing facts + short reverse check |
| FR-WH-011 | T015—T016、FINAL、verify-code | AC-WH-11 | P6 + FINAL + verify | bounded review cycle + handoff |

所有来源均回到 decision-log 的 R-001—R-011、D-001—D-019；不存在 plan 自行新增的产品范围。每个 task 的完整 source_refs、命令、oracle、证据和 STOP 见 `tasks.md`。

## 18. Final current-snapshot aggregate strategy

- **Tier**：`fullstack`。
- **Design skill**：build-plan 只调用 `test-routing-advisor` 预判 `fullstack` + `fullstack-slice-testing`；build-code 检查最终真实 changed files，必要时重新调用 `test-routing-advisor`，再调用 `fullstack-slice-testing` 执行本节。`testing-system-blueprint` 不调用。
- **Command**：`npm test`；若仓库 package script 变动，必须在 build-plan 重新核实，不得临场替换。
- **Scope**：P1—P5 相关 contract/integration/official receipt/review/inventory 测试，随后完整 test suite；按当前 snapshot、当前 task identity 和干净 candidate worktree 执行。
- **Expected exit**：0。
- **Oracle**：`ORACLE-FINAL-CURRENT-SNAPSHOT-001`：命令 exit 0；canonical receipt、output hash、snapshot tree、逐 AC evidence 和未决风险互相绑定；不能用单一 exit 0 代替逐 AC 结论。
- **Fixtures/services**：使用仓库现有 Vitest fixtures、TaskKernel temporary task、history fixture；不启动外部 provider，不复用别的 task 的 records；退出后清理临时目录。
- **Browser route**：N/A — 无 UI。
- **Evidence**：`quality/tests/verify-code-final-full-current.json`、`quality/tests/output/verify-code-final-full-current`、`quality/evidence/verify-code/acceptance-summary-0b3acdbb2796dd5ce18ae96323262036217b17dfa6c40eecb02c5ce86909caa5.json`。
- **Coverage limits**：不证明真实第三方 provider 可用性，不把 unavailable 改成 pass；不证明 commit/push/merge/archive/cleanup 已授权。
- **Failure action**：任一失败保留原始 output/receipt，回到受影响 task；不得只重跑全量来掩盖局部失败。
