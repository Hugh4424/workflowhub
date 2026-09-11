# 实现计划：规划任务的提问边界、产物纪律与不归档收口

- **Input**：`decision-log.md`（D-001…D-034）、`spec.md`（20 FR / 16 AC）
- **Template version**：`plan-task.v4`
- **Design status**：draft — D-033 已授权正常 cleanup 后的现有 close 窄扩展；T009/T010 按下文明确接口修订，产品执行仍 pending。D-034 为单独授权的阶段工具修复，不计作产品卡完成。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| decision-log.md#增量决策 | D026/027/029/031/032 覆盖旧决定的精确边界 | M 初读与产品歧义；S 仅冻结packet相关段 |
| spec.md#5-功能需求、#11-验收标准 | 20FR、16AC、场景及验收限制 | M 设计；S/B 相应任务开始前 |
| plan.md#solution-design、#file-boundary | 工程链路、唯一文件owner与恢复 | M 统筹；S/B 执行前；P 仅独立读取 |
| plan.md#requirement-and-verification-traceability | 单一 source→FR→AC→task→oracle 映射 | M/S 对账；B 按卡定位 |
| tasks.md#phase-p1、#4-final-current-snapshot-aggregate-strategy | RED/GREEN与唯一最终聚合、执行记录 | B 实施与取证；M 只收带路径摘要 |

## Quick Read

- **Goal**：规划任务先声明类型，只问方向问题；PRD保留完整旅程与任务地图；末尾有真实非阶段复盘；四动作收尾不归档、不写完成记录。
- **Non-goals**：不改五阶段拓扑，不新增公共命令/schema/store/类型历史/父子链，不恢复自动差额，不重写旧规划材料，不真跑新规划任务，不补D029验收缺口。来源：D-001、D-016、D-018、D-019、D-027、D-029。
- **Before**：make-decision无任务类型分流；PRD方向边界未约束；reflection_facts只是optional材料槽；收口多处固定五步并最终写completed；链检查h4已局部修复但零条目仍可报零告警。
- **After**：当前声明驱动主会话提问与窄材料检查；既有模板承载方向内容；同一portable outcome承载复盘并读回；新规划任务默认收尾裁剪archive，显式legacy `--mode=planning`与普通任务保留原动作集。
- **Main risk**：物理收口不是删一项数组即可；选择、授权、执行校验、物理读回、重试和所有完成写点必须一致。D032已明确主仓相对路径保留后可正常cleanup。
- **Next step**：先完成本阶段审查处置、最终spec-analyze及现有build-plan最终人类确认；确认须绑定本task、当前四材料revision/snapshot及plan/tasks源hash，正式run读回后才可把T001作为后续实施入口。尚未取得确认时仅继续修订计划，不执行T001…T012。此处是既有stage合同的显式依赖，不新增gate、receipt、状态对象或公共命令；Git与物理动作始终另需独立授权。

## Technical Context

### Global Constraints

- **Verified facts**：认证任务worktree分支为 `task/workflowhub/workflowhub-build-prd-workflow-hardening-20260911`，基线HEAD `45283fd36b72cafd425592fb0c418b28abc2d066`；当前已有上游改动，不覆盖。当前四材料是工作真相，旧facts/receipts不是开始工作的许可证。
- **Language / runtime**：Node.js 24；当前环境v24.14.0；ESM；Vitest 2.1.9；已有ajv/js-yaml，不加依赖。
- **Primary dependencies**：既有TaskHandle/TaskKernel、Git、portable workflow、wh-review与Vitest。Provider失败仅保留unavailable，不替换为质量通过。
- **Storage / state**：类型只在decision-log任务身份段；复盘只复用已声明portable outcome与reflection_facts；收口只用已有plan、confirmation、逐动作授权/结果。不往task.json/facts.jsonl/index加字段。
- **Testing**：只运行本计划8个修改测试文件的命名目标与一次9文件有界聚合。RED/GREEN只设计、此阶段不执行。临时Git fixture和本地裸remote由测试创建与清理；不接用户remote。
- **Target environment**：支持Node/Git的CLI宿主；宿主主会话拥有提示词执行与受控kernel调用，不绑定Codex私有会话扫描。
- **Scale / scope**：4个工程Phase、5组RED/GREEN、1张登记卡与1张FINAL；29个精确文件，唯一新增文件为test-only结果适配。
- **Unresolved facts**：RISK-02/03/05与OPEN-02…05保留；不存在可从hash推导的“重新处置已完成”。普通任务提问一致、大白话质量、真实可接手性无完备客观oracle，不临时创造。

## Code Anchors

| Exact anchor / signature | 当前真实职责 / consumer |
| --- | --- |
| `workflows/make-decision/SKILL.md:196` | 主会话实际提问规则；在首次提问前按任务身份段分流，不拿阶段末validator充当提问生成器 |
| `runtime/stage/stage-content-contracts.mjs:3273 analyzeDecisionConvergence(decisionLogMarkdown,{originalRequirement,requirementMessages,requirementCoverageOutputs,taskId,directionReview,interactionAggregate,requireOutline}={})` | 既有材料校验扩展点；保留返回形状，由现有handler消费；仅在内部读取固定声明和当前内容 |
| `runtime/stage/stage-handlers.mjs:595 interactionAggregateFacts(worker,input,expected)`、`:124 currentDecisionFreeze(worker,input,decisionLog,snapshot)` | 已有decision hash/source绑定consumer；只复用，旧hash拒绝不是重处置语义证明 |
| `tools/cli/check-decision-log-chain.mjs:53 checkDecisionLogChain({markdown,source_ref="decision-log.md"}={})` | h3/h4条目与链告警；`tools/cli/run-checks.mjs:221`为唯一aggregator |
| `runtime/stage/stage-runner.mjs:2952 runOfficialStage(stage,context,invocation,publication,{requireStageOutcome,signal}={})` | 现有返回含step_outcomes/completion/stage_outcome_summary；CLI `stage-runtime.mjs:956`直接返回；主会话逐项读取，不扩摘要schema |
| `skills/spec-prd/SKILL.md:130`、`skills/spec-prd/templates/prd-template.md:17,29,55` | 唯一PRD内容writer；product_overview/task_map与16卡字段承载方向旅程、覆盖及最小接手 |
| `workflows/build-prd/steps.json:78 report-facts-and-handoff` | 现有第6步及portable-workflow-outcomes输出位；补生产/读回，不新增第7个正式stage |
| `runtime/task/task-kernel-implementation.mjs:719 publishCanonicalRecord(relativePath,raw)`、`runtime/task/task-handle.mjs:577 readRecord(relativePath)` | 通用不可变保存/读回；由build-prd主会话的已有认证上下文调用，不增加专用writer |
| `skills/wh-review/scripts/review-materials.mjs:1922 buildReviewMaterials({...materials...})`、`:2132` | 已消费optional reflection_facts并打入review bundle；不是复盘producer，也不为末尾复盘新增review调用 |
| `core/task-close.mjs:1865 prepareDeliveryClosePlan({task,kernel,delivery,allowMiniTaskFocused,closeMode,requiredAttachments}={})` | 从声明/显式legacy模式选择已有动作的窄扩展点 |
| `core/task-close.mjs:1359 closeDelivery({...delivery,closeMode,replyText,stepSlug...}={})`、`:2270 createDeliveryCloseExecutorRegistry({task,kernel,plan}={})` | 授权集合、五步检查与最终completed写点都需同一选择；不是仅改DELIVERY_STEPS |
| `core/task-close.mjs:2061 inspectDeliveryCloseState({task,kernel,plan}={})`、`:2476 executeClosePlan(options={})` | 物理读回、逐动作复用与恢复；不重复已完成动作；专属WT cleanup确实删除目录与分支 |
| `tools/cli/task-close.mjs:44 context(values,{workspaceRequired}={})` | execute/status允许在cleanup后按已有plan/ref读回；D033在既有入口支持archive声明参数，不新增子命令 |
| `runtime/stage/stage-content-contracts.mjs:6496 projectAcceptanceExecutionData(tasks,...)` | 既有acceptance_data command/service消费者要求可比较JSON，不接受Vitest人读stdout冒充逐AC结果 |

- **Read now**：只消费已冻结的decision/spec与以上核查摘要；不展开旧归档。
- **Must read before task**：每卡自身允许修改的函数/模板、既有测试fixture、当前diff；T010必须覆盖所有完成写点和恢复路径。
- **Context mode**：Lite，按卡边界取片段；首次源材料冻结、改材料后重冻，packet为派生输入而非第五权威。生产者是本阶段host，consumer为spec-plan/spec-tasks/审查；来源变更使旧packet仅作历史证据。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 类型与提问 | extend | 当前decision-log、make-decision与analyzeDecisionConvergence | 不加持久类型字段或历史账本；若未来经确认替换类型约定，删除当前条件分支 |
| PRD内容与子任务接手 | extend | spec-prd既有模板字段 | 不加章节；共享定义引用一次，不重复母任务实现细节 |
| 非阶段复盘 | extend | 既有第6步、reflection_facts、publishCanonicalRecord/readRecord | 从未接线的声明补真实调用；无新增通道，失败unavailable |
| 物理交付 | extend | 现有plan.steps、授权和executor链 | D031初次四动作，D032主仓路径读回，D033后续归档两步并分别消费archive/commit/push授权；旧模式保护 |
| 最终结果转换 | new（test-only） | 既有acceptance_data command消费者 | 唯一NEW测试fixture；owner=T011；consumer=T012与现有acceptance executor；不加runtime/schema/CLI；当测试工具原生提供同形逐AC结果时删除 |

## Solution Design

### Overview

主会话在首次正式需求提问前创建当前decision-log任务身份段：已有明确类型就写该声明；缺失、冲突或不能从用户明确意图确定时先问类型，仅暂停依赖类型的提问/内容分支，其他准备继续，不默认普通或规划。写入后读回唯一声明，再开始正式提问。固定标签“任务类型”，受控值“规划任务/普通任务”，仅任务身份段为唯一来源；缺失、重复、冲突与未知值不得猜。普通任务仍可讨论实现细节；规划任务依据D004唯一十类禁项，把机制设计留给子任务。中途改类型后，主会话在既有当前决定条目里逐条引用受影响的旧问题/产物，注明按新边界保留、改写或重新询问的理由和新内容位置；旧immutable事实只读，不把旧内容直接当成新类型证据，也不新增处置账本。六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）均须有真实回答或显式留空理由；只更新hash不能算重新处置。

PRD不改变结构、字段名和两次内容调用。完整旅程放product_overview；覆盖与责任卡放task_map；目标/边界/验收/依赖保持方向层可执行。子任务只消费自己的条目与自身四材料，边界差异记在自己材料，不读取自动父子清单、不写母或兄弟，不触发母任务收口、不移动或删除其文件；测试同时检查调用账目与前后文件树，不能只比较正文。D027/D033人工完成声明由当前主会话理解并把原话保存、读回；声明来源与close plan操作确认分开，不增加机器语义分类器、N/M差额或兄弟任务扫描。

build-prd第6步在报告前由主会话生成非空reflection_facts（实际结论与步骤引用，绑定task/workflow），在已经声明的portable outcome位置调用既有kernel保存并读回，然后交给报告/接手者。提供并测试实际窄调用片段；没有绑定上下文、实际结论、保存或读回时标unavailable，不制造专用runner、stage outcome或额外review。

规划类型的默认收尾用现有close路径选择commit→merge→push→cleanup；显式legacy `--mode=planning`仍沿用旧模式动作集，普通任务不变。所有动作分别授权、读回，archive不被悄悄授权或调用，所有completed写点必须跳过。D032要求先从主仓目标分支的specs/<task-id>/读回材料且push完成，再允许清理专属WT；不要求旧绝对路径存在。失败和重试沿用已有plan/逐动作事实，绝不补新“已收口未归档”记录。

初次四步也须在 `deriveCurrentDeliveryInput`/普通verify-code材料要求之前按当前唯一任务类型分流：规划类型复用现有 `planningMaterialContext` 读取decision-log、PRD及其必要附件，复用非正式阶段的planning确认/授权writer，但不把新流程的close_mode写成显式legacy planning。普通类型仍按旧verify-code来源与原五步执行，显式legacy planning优先走旧分支。新规划plan按既有严格四步/两步与冻结的 `delivery.task_commit` 中声明共同验证类型；不得只凭caller传入步骤数组推断已认证类型，也不能在归档后再次依赖已经移走的当前源文件。D033允许的分支必须贯穿材料准备、确认、授权、executor/probe与返回，不只删除archive数组项。


### 清理后的后续归档：现有 close 窄扩展（D033 / T009-T010）

**不是已有能力**：现有 `openCurrentTaskWorkspace` 必须读到真实WT；`authorize archive` 只保存授权。下列分支是待实施设计，不把main伪装成task Workspace，不重建旧WT。唯一owner为现有close；consumer为现有prepare/confirm/authorize/execute/probe/report；替代“清理后只能重试旧plan、不能新归档”的缺口，删除条件为该需求或既有close实现被经确认的机制替代。

**入口与计划**：既有 `prepare --archive=<本次声明ref> --plan-hash=<初次四动作plan hash>` 从显式旧plan与逐动作确认/授权消费/结果核对正常cleanup，然后从 `task.manifest.target_repo_root` 的当前目标分支准备新的归档plan。来源固定 `specs/<task-id>`、目标固定 `specs/archive/<task-id>`，拒绝任意路径、symlink、错task、非规划任务、未完成初次四动作或与显式legacy mode混用。CLI仅该参数分支允许无Workspace的task/kernel，仍通过 `authenticateWriteBoundary`；close自行验证主仓归属和真实clean状态，不能把无Workspace视作无校验。当前main HEAD填现有 `delivery.task_commit/target_baseline`，远端基线读回一致；现有plan.steps严格为 `archive-spec`、`push-target-branch`，不新增mode/字段/前后plan关系。主仓可较初次交付前进，但当前材料必须重新展示并绑定本次声明；冻结后任何漂移均拒绝。

**两种人类事实**：当前主会话保存、读回实际声明原话（下文T008补具体producer）；旧“完成”不替代本次有效答复，后续撤回原话保留。准备归档后另展示实际移动、归档commit和push范围，收到真实操作答复才调用 `confirmClosePlan`。声明ref不能作为close confirmation ref，后者的subject必须精确绑定本次plan。未完成、仅“不做某项”、撤回或没有明确归档令时主会话不调用归档入口；这不是机器自然语言枚举。声明自身不会产生close approval、授权或Git动作。

**声明的实际producer与保存合同（T007/T008）**：把窄调用片段写入现有 `workflows/build-prd/SKILL.md` 第6步的交接说明；清单完成后的当前主会话在该说明下接收新原话，不能声称重跑前五步。载荷是已登记portable outcome位置的普通JSON：`{task_id,workflow:"build-prd",material_refs:[{ref,sha256}],reply_text,step_slug:"report-facts-and-handoff"}`。material_refs至少包括本次实际展示的当前decision-log与PRD，并带现有必要附件ref/hash；全部来自main当前材料读回。raw为 `JSON.stringify(payload,null,2)+"\n"`，ref为 `quality/evidence/portable-workflow-outcomes/build-prd/<sha256(raw)>.json`。调用既有 `kernel.publishCanonicalRecord(ref,raw)` 后 `task.readRecord(ref)` 比原字节与hash，返回真实ref/hash/原话供本次归档读取；失败保持unavailable，不继续执行。复用T008已经明确的openTask/createTaskKernel接口，不新增script/export/schema/store，不借human-confirmation.v3的accepted/rejected伪装清单完成。声明JSON和复盘JSON由调用方显式引用，各自校验所需字段；禁止扫描目录猜latest或把声明当复盘。T007/T008须执行同一snippet验证原话原样、错task/错hash/空话拒绝及保存失败无成功ref；T009/T010再验证未完成/撤回/无归档令的主会话调用者不触发归档，以及声明ref冒充操作确认会被拒绝。

**授权与执行**：`execute --archive=<本次声明ref> --plan-hash=<归档plan hash> --confirmation-ref=<本次操作确认>` 始终经过 `executeClosePlan`。归档step执行前分别验证并消费 `archive` 与 `commit`，任一个缺失均不得移动材料；push另消费 `push`。利用现有授权对象/consumed记录的operation、plan、step绑定，不新增操作种类。原archive executor内已经含git mv和commit；只为新两步计划补受限分支，保留普通/legacy原代码路径，禁止直接registry.executorFor(...).execute绕过调度。便捷 `close --archive=... --plan-hash=<初次plan>` 只组合相同准备/操作确认/各授权/执行链，所传reply必须是展示后真实操作答复。

**失败、重试与读回**：源到归档的完整树必须保持相同；move后commit失败仅接受与本次plan一致的完整等字节暂存重命名，其它暂存、未暂存、目标冲突、部分移动和未知文件均拒绝。commit成功不再移动或提交；push失败只推送已授权归档commit，禁止带入此后混入主分支的提交；远端已收到则读回并补既有结果事实。动作已成功但记录写失败，先probe确证再补同一step事实，不重复物理动作。重试显式使用同一归档plan，不重新自动确认或签授权；未满足的前置/漂移错误保留，不静默换计划。后续不再merge/cleanup；close/execute/complete/status都不得写completed.json，不写五阶段/质量/发布结论。CLI finish引用实际plan或step结果，不再对新规划路径硬读不存在的completed.json。

**接口落点（均为计划中的内部变更）**：
- `tools/cli/task-close.mjs#context/main/usage/finish`：限定参数路由、无WT上下文、真实返回引用；原调用保持。
- `core/task-close.mjs#closeDelivery/prepareDeliveryClosePlan`：增加内部可选参数 `archiveDeclarationRef/priorPlanHash`，在 `deriveCurrentDeliveryInput/openCurrentTaskWorkspace` 前分流；私有 `preparePostCleanupArchivePlan({task,kernel,priorPlanHash,declarationRef})` 复用plan writer。
- 私有 `readPlanningDeclaration({task,declarationRef,materialIdentity})` 验ref/hash/task/当前材料/原话；不解释“完成”。冻结材料身份供已有planning confirmation/authorization writer复用，不依赖已删WT；不能强迫新流程写legacy close_mode=planning。
- 私有 `requiredCloseAuthorizations(plan,step)` 对新archive返回两operation，其余原映射；现有 `executeClosePlan(options)` 增加 `archiveDeclarationRef`。现有kernel consumer已支持每operation的幂等，不改kernel。
- `validateDeliveryPlan/createDeliveryCloseExecutorRegistry/physicalDeliveryMissing/inspectDeliveryCloseState/completeDeliveryClosePlan` 只接受严格5/4/2动作组合并统一读回；新分支的主仓preflight和物理probe留在close，不新造恢复平台。

### Module responsibilities

- **make-decision / decision-log**：主会话先创建并写入明确类型，unknown先澄清，再在提问前读回当前类型；材料校验只证明当前声明/内容/绑定，不裁决产品方向，不推断历史执行。
- **spec-prd / build-prd**：前者写PRD，后者编排两次内容调用与非内容收尾；复盘消费者为同一步报告与后续接手者。不能用review optional槽的存在性替代保存。
- **task-close existing owner**：同一当前声明和显式模式决定动作子集，贯穿plan→authorize→executor→probe→return；D033允许在已有archive/push执行器内加入限定的清理后归档分支，普通/legacy分支不变，不新增public command。
- **stage主会话**：按manifest列出每个step/skill真实状态；引用先读回，产物存在性和完成判据分开。无执行来源是缺失，不统一解释成正常降级。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：原有调用语义、task.json/index/fact schema与五stage枚举保持；D033仅在既有close/prepare/confirm/execute参数解析中支持 `--archive=<当前声明ref>`，复用 `--plan-hash`，不新增命令或mode。内部使用当前材料和现有plan.steps，不保存第二份type/close模式。
- **计划新增的内部纯函数（不是既有函数）**：在既有 `runtime/stage/stage-content-contracts.mjs` 增加 `readTaskTypeFromDecisionLog(markdown)`，仅返回 `规划任务|普通任务|unknown`，不写状态。只读唯一“任务身份”章节中的固定标签（表格行或带粗体标签的列表项），声明数量不为1或取值非受控值即unknown。唯一owner=T002；真实consumers=现有analyzeDecisionConvergence与core/task-close（后者已从此module导入activeAcceptanceCriterionIds）；测试=T001及T009。删除条件=当前类型声明约定被经确认的替代机制取代。复用此函数，禁止在close复制第二份解析规则；本条不增加公共CLI、schema或持久字段。
- **Data flow / state**：声明→规划/普通提问→当前产物；改声明→旧当前内容明确停止消费→重新处置；PRD草稿/确认顺序不改；复盘生成→immutable保存→读回→报告；四动作部分完成→按旧事实补未完成；人工声明完成+独立归档令才归档。
- **API contract**：N/A — 无HTTP/API端点变化；kernel方法保持，既有close新增的参数及私有函数见后续归档契约。归档声明由人负责，机器只核对来源/版本/引用，不能从最后一个子任务或关键词猜完成；不能发现被调用者隐瞒的后续撤回。
- **UI / external code**：N/A — non_ui；不新增页面、组件、Design.md、Experience.md、截图或浏览器QA。
- **Fail-loud behavior**：未知类型明确报告；零条目明确“未识别到任何条目”；空复盘/错误绑定/读写失败unavailable；缺授权、主仓材料缺失、步骤集错配、错误scope不得写成功。质量缺失不阻止同task修复。


### 非stage复盘的具体保存与读回（T008）

待补的是主会话指令中的调用，不是新生产脚本或schema。显式输入为 `projectName/taskId/taskPath`、当前decision/PRD的ref+sha256、实际step结果及本次复盘结论；不得bootstrap一个build-prd正式stage，不读取旧session。保存payload是既有portable outcome位置的普通JSON：`{task_id,workflow:"build-prd",material_refs:[{ref,sha256}],step_results:[{step_slug,status,evidence_refs}],reflection_facts:{summary,what_helped,what_to_improve,remaining_unknowns}}`。这些字段承载当前真实事实；不追加schema_version、stage、质量pass或新类型账本。缺task/workflow绑定、材料ref/hash、非空summary或实际step来源时不保存成功；失败报告unavailable。

T008把下述实际接口顺序写入现有SKILL第6步并让测试执行同一片段：从 `runtime/task/task-handle.mjs` 导入 `openTask`，从 `runtime/task/task-kernel.mjs` 导入 `createTaskKernel`，从Node crypto导入createHash；`task=openTask(taskPath,projectName,taskId)`，`kernel=createTaskKernel(task)`；将payload规范化为 `raw=JSON.stringify(payload,null,2)+"\\n"`，算其sha256，ref为 `quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json`；`kernel.publishCanonicalRecord(ref,raw)` 后立即 `task.readRecord(ref)`，要求返回字节与raw完全一致并重算hash，返回 `{ref,sha256,value}`。kernel只负责create-only保存，不替调用者认证payload语义或证明完成。

真实consumer为同一第6步的报告：仅从刚读回的value读取summary与step_results，分别报告成功/失败/未完成，并输出该ref/hash；后续接手者按显式taskPath打开同一task，再按ref读回和验hash后消费同一value，不从optional review槽推断已执行。T007/T008验证保存→读回→报告摘要与交接引用一致，空内容/错task/错workflow/缺来源/读写失败均保持unavailable。owner=build-prd主会话；替代关系=填补已声明portable路径的缺失producer，不增加第二份记录；删除条件=该portable消费通道被获准替代。


### 第6步唯一可执行来源与人工归档调用边界

T008在现有 `workflows/build-prd/SKILL.md` 第6步加入唯一标记 `// build-prd-step6-source:start` / `// build-prd-step6-source:end` 包围的完整ESM源码块；该块是宿主实际执行来源，不是说明用伪代码。局部函数 `reportFactsAndHandoff({projectName,taskId,taskPath,packageRoot,reflectionPayload})` 负责调用已有openTask/createTaskKernel、校验payload、保存raw并读回验hash，再调用同块的 `readReflectionForReport({task,ref,sha256,taskId,materialRefs})`。函数只从读回value生成 `{status,summary,step_results,handoff:{taskPath,ref,sha256}}`；失败返回 `{status:"unavailable",error}`，不得带成功handoff。主会话必须执行此块及该函数，最终报告逐字段消费返回值，不能用保存前payload或optional reflection_facts槽替代。这两个函数仅是现有SKILL块的局部调用名，不新增生产export、script、公共命令或持久对象。

同一第6步交接说明给出实际接手调用：接手主会话用handoff显式taskPath打开任务，并执行同一源码块的 `readReflectionForReport`，传原ref/hash和当前材料身份；不重新生成复盘、不选择latest、不增加第二次review。reader核对raw hash、task/workflow、material_refs以及reflection_facts/step_results后才返回报告值。与声明JSON字段不符、内容损坏、旧材料或错误ref都返回unavailable，不用旧总结兜底。现有 `steps.json#report-facts-and-handoff` 与第6步顺序保持，步骤文字明确链接此唯一块；不新增另一条调度路径。

T007/T008在已有contract测试中按唯一标记从真实SKILL读取原始块并执行；标记为0/重复、源码不可执行、只存在说明不调用reader均为失败。测试不得复制实现到fixture或只验字符串存在。真实临时TaskHandle/Kernel记录保存与读取顺序，断言第6步报告输出来自readback，接手调用再次读取同ref并得到同值；篡改hash/材料/task/workflow、把声明ref冒充复盘、读写失败时没有成功handoff。测试可加载该块的局部函数进行边界注入，但必须通过同一 `reportFactsAndHandoff` 入口验证producer→reader→report/handoff整个切片。实际LLM有没有执行指令仍按D019不实跑、不声称验证。

**人工声明的caller合同**：仍由当前主会话读取本次清单、有效声明原话与最新用户消息；未声明、未完成、已撤回、无明确归档指令或材料已变时，不把declarationRef传入归档prepare，报告具体缺口并等待需要的人类答复。不能用关键字分类、布尔fixture或旧confirmation替代这一步。通过这一步后，先保存/读回当前声明，再走已有prepare→展示plan→`confirmClosePlan`→archive与commit分别授权→execute；push单独授权。展示及既有操作确认的问题必须同时列出当前清单/材料ref/hash、声明原话/ref/hash、归档与提交后果，明确询问用户该清单已结束（包括明确放弃项）且现在同意归档；accepted只表示用户对这份展示的实际操作答复，不由程序从声明文本计算。材料hash继续保存在已有 `delivery.planning.materials` 的 `decision-log.md`/`prd.md` 键、附件继续用既有required_attachments/attachments。仅新两步归档plan由私有preparePostCleanupArchivePlan在同一materials映射追加唯一条目 `[declarationRef]:sha256(raw)`；这里是现有映射的新输入，不是已有versioned_refs字段（close plan并无该字段），也不新增schema、对象或状态。validateDeliveryPlan的新两步分支要求除固定材料键外恰有这一合法portable task-store ref且与CLI archiveDeclarationRef完全相同，再由readPlanningDeclaration用task.readRecord验raw hash、task/workflow与当前material_refs；不把声明当仓库文件、PRD必要附件或material_files成员。confirmClosePlan/closeConfirmation及逐动作授权继续以既有closePlanHash绑定完整plan，因此声明或材料条目改变使旧plan确认/授权不可用于新plan；普通和显式legacy planning原映射不增加声明条目。现有 `validateDeliveryPlan` 非legacy时拒绝delivery.planning的分支（当前约1743行）须按已认证规划类型及严格4/2步骤集窄放行；同一判定用于 `confirmClosePlan/publishPlanningHumanConfirmation/publishPlanningIrreversibleAuthorization` 的既有非stage分流，不能只修改materials映射或强写legacy close_mode。owner=T010，唯一consumer为新两步close分支，替代关系为复用现有材料hash绑定；若D033后续归档分支移除则同时删除该条目处理。

T009/T010复用真实临时Git/Kernel与现有close入口，按上述caller到prepare/confirm/authorize/execute顺序测试：缺声明/ref损坏/材料过期在prepare拒绝；有效声明但无当前操作确认、确认拒绝、旧plan确认或少archive/commit授权时执行无移动/提交；用户撤回或声明未完成的fixture不提供操作确认，验证close拒绝执行且不能把声明ref当confirmation。测试同时提取第6步原始指令核对上述人类前置条件、展示内容与先后关系；这只验证caller指令合同和机械拒绝链，不宣称fixture证明了LLM识别自然语言撤回。隐瞒的新消息或主会话错误理解原话不是runtime能检测的事实，仍由D027/D029/D019的人工责任与未实测限制披露；不得引入新枚举、撤回链或绕过调度的直接executor调用。

## File Boundary

### NEW

- `tests/fixtures/planning-workflow-hardening-acceptance.mjs`

### MODIFY

- **P1**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/stage/stage-content-contracts.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`
- **P2**：`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json`、`tests/contract/spec-prd-skill-contract.test.mjs`、`tests/contract/build-prd-review-contract.test.mjs`
- **P3**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`
- **P4**：`skills/decision-log/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/catalog.yaml`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`

### DO NOT TOUCH

- `runtime/task/task-store.mjs`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`：只复用既有方法，不新增writer/schema。
- `runtime/review/stage-materials.json`：reflection_facts槽已存在，不重复登记。
- `runtime/task/workspace.mjs`：正常WT删除器保持；D032不要求保留原绝对路径。
- `runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-completion-facts.mjs`：使用现有返回与绑定，不以新控制面修OPEN04/05。D034单独允许stage runtime必要收尾依赖修复；其精确diff与针对性证据走当前quality，不并入本12卡，不顺带修其他控制面。
- `CONTEXT.md`、`docs/adr/0027-planning-task-question-boundary.md`：OPEN06已由build-spec落文；本阶段只核对，不再展开治理重写。
- `skills/wh-review/scripts/wh-review-cli.mjs`：上游已存在修复，保留且纳入交付diff核对，不借本计划改provider链。
- `specs/archive/workflowhub-build-prd/decision-log.md`、`specs/workflowhub-mechanism-simplification-20260910/decision-log.md`、`specs/workflowhub-mechanism-simplification-20260910/prd.md`：旧材料只读，不回写、不精简、不迁移。
- 当前 `decision-log.md`、`spec.md`：build-code不自行改范围；产品歧义回相应owner。D032/D033/D034已由真实回复增量澄清。

## Technical Decisions

### DEC-001 — 主会话分流，既有合同检查，不造类型系统

- **Problem**：实际提问发生在handler之前，晚期validator无法阻止之前的问题。
- **Options**：仅改validator不充分；新增type registry过重；选择现有主会话规则+材料局部检查。
- **Selected**：extend；固定声明读取，规划分支限定D004，普通分支不收紧。
- **Reason**：真正触达提问consumer，且不新增数据模型；重处置由实际新内容证明，不由hash推断。
- **Consequence / risk**：不真跑规划任务，实际提问效果未知；类型错误仍可能先问错一轮。
- **Fallback**：回退新增分支，不删除已记录真实问答或旧风险。

### DEC-002 — 复盘用已有非阶段位置补调用

- **Problem**：reflection_facts只有材料声明，原先无生产保存读回。
- **Options**：复用主会话+kernel；新增专用CLI/runner；套正式stage-reflection。
- **Selected**：extend，第6步生产并调用通用canonical record，再真实读回。
- **Reason**：D010明确非stage且禁止新通道；已有writer足够。
- **Consequence / risk**：宿主无受控kernel时只能unavailable；指令中的调用片段必须被测试实际执行。
- **Fallback**：保留原事实报告与不可用原因；不为凑完成改stage枚举。

### DEC-003 — 一个动作选择贯穿交付全链

- **Problem**：固定五步约束散布于plan、授权、executor、物理读回和完成写入。
- **Options**：全局删archive破坏普通任务；新mode违反边界；只删数组仍被下游拒绝。
- **Selected**：extend，同一显式类型/模式选择初次四动作；后续显式归档参数选择 archive-spec / push-target-branch 两步，前一步分别消费archive和commit授权。普通及显式legacy动作不变。
- **Reason**：覆盖真实producer→consumer，保留逐动作恢复与独立授权；无新结构。
- **Consequence / risk**：D032旧绝对路径失效，接手者改读主仓相同相对路径；遗漏任何写completed路径都是失败。
- **Fallback**：未执行的动作可回退代码；已发生动作保留事实，只补未完成，不逆改历史。

### DEC-004 — 最小测试结果适配，不新增验收框架

- **Problem**：现有acceptance command消费者要求逐AC可比较JSON；Vitest stdout本身不是该输入。
- **Options**：把exit0复制为全部AC通过是假绿；新增通用验收框架过度；选择单一test-only适配fixture。
- **Selected**：new，`tests/fixtures/planning-workflow-hardening-acceptance.mjs`，仅本任务测试收集。
- **F10 real threat**：实际canonical consumer读取不到逐AC结果，或三个定性缺口被漂绿。
- **F10 existing cover**：复用Vitest JSON reporter、现有9个受影响文件测试与acceptance executor；不新造测试执行器。
- **F10 bypassable**：无生产工作gate；测试/接口消费缺失只能留下unknown/unavailable，不禁止修复。
- **F10 maintenance cost**：一份有界映射和结果适配；必须按实际命名断言映射每个AC，零匹配/重复/失败不能算pass。
- **F10 disposition**：keep（仅该fixture）；有原生同形输出即可删除，不扩成框架。
- **Consequence / risk**：D029三个定性AC的原始缺口必须以unavailable可读输出保存，不能以proxy替代产品oracle。
- **Fallback**：适配器失败保留原Vitest JSON与stderr，不伪造entries，不扩大为全仓回归。

## Test Strategy

build-plan只设计，不执行RED/GREEN。每组测试新增 `planning-hardening` 命名目标；RED为目标断言失败而非环境失败，GREEN使用同命令、同oracle、同pair证据路径。命令未选中任何测试就是设计/执行错误，不能用Vitest exit0误判。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AC-TYPE-001 AC-ASK-001 AC-ASK-002 AC-ASK-003 AC-PRD-001 | T001 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 1 | ORACLE-TYPE-ASK / `quality/evidence/build-code/T001-T002/pair.json` |
| AC-TYPE-001 AC-ASK-001 AC-ASK-002 AC-ASK-003 AC-PRD-001 | T002 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-TYPE-ASK / `quality/evidence/build-code/T001-T002/pair.json` |
| AC-CHECK-001 AC-CHAIN-001 | T003 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 1 | ORACLE-TRUTHFUL-END / `quality/evidence/build-code/T003-T004/pair.json` |
| AC-CHECK-001 AC-CHAIN-001 | T004 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-TRUTHFUL-END / `quality/evidence/build-code/T003-T004/pair.json` |
| AC-PRD-001 AC-PRD-002 AC-CHILD-001 AC-CHILD-002 AC-CONTRACT-001 | T005 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 1 | ORACLE-PRD-HANDOFF / `quality/evidence/build-code/T005-T006/pair.json` |
| AC-PRD-001 AC-PRD-002 AC-CHILD-001 AC-CHILD-002 AC-CONTRACT-001 | T006 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-PRD-HANDOFF / `quality/evidence/build-code/T005-T006/pair.json` |
| AC-REFLECT-001 AC-CHECK-001 AC-META-001 AC-CLOSE-002 | T007 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 1 | ORACLE-PORTABLE-REFLECTION / `quality/evidence/build-code/T007-T008/pair.json` |
| AC-REFLECT-001 AC-CHECK-001 AC-META-001 AC-CLOSE-002 | T008 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-PORTABLE-REFLECTION / `quality/evidence/build-code/T007-T008/pair.json` |
| AC-CLOSE-001 AC-CLOSE-002 AC-CLOSE-003 AC-CHILD-002 AC-META-001 | T009 | RED | `node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 1 | ORACLE-UNARCHIVED-CLOSE / `quality/evidence/build-code/T009-T010/pair.json` |
| AC-CLOSE-001 AC-CLOSE-002 AC-CLOSE-003 AC-CHILD-002 AC-META-001 | T010 | GREEN | `node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / 0 | ORACLE-UNARCHIVED-CLOSE / `quality/evidence/build-code/T009-T010/pair.json` |
| 全部16AC及已知缺口 | T012 | FINAL | `node tests/fixtures/planning-workflow-hardening-acceptance.mjs` / 0（收集成功，不代表全AC通过） | ORACLE-FINAL / `quality/evidence/build-code/T012/final.json` |

- **Scope / risk dimensions**：行为结果（类型/内容）、状态与数据（改类型/复盘/部分收口）、错误取消恢复（空/错绑定/拒绝/失败重试）、权限安全（四动作授权/人工归档/子任务只读）、原子性（现有record锁及不可变写）、seam（主会话→kernel→读回→报告、close各consumer）、可观测来源（步骤事实和原始输出）。UI维度N/A；不引入并发新机制，保留已有串行与锁。
- **Tier / method**：独立test-routing-advisor判定总路线fullstack，原因是P3的授权、物理副作用与失败恢复，不是Phase数量。P1/P2局部feature使用backend-testing；P3与P4最终聚合使用fullstack-slice-testing的non_ui切片。无UI，不执行frontend-testing或浏览器；routing的pass只表示判类成功，不是测试通过。
- **Fixtures / service**：当前源码的本地fixture、临时隔离repo和bare remote、真实TaskKernel保存读回；host真实用户回复不由fixture伪造。测试中的用户回复是测试输入，不能发布成本任务真实确认。
- **预算与重复边界**：目标对每次优先≤60秒，P3目标≤180秒；一次FINAL总预算600秒。超时保留部分结果与命令fingerprint；只有新修改/新失败才复跑受影响目标，禁止全量vitest/npm test/test:safe。
- **Final producer contract**：T011 fixture在FINAL中只运行上述8文件加 `tests/decision-log-content-contract.test.mjs` 一次，共9个受影响文件，全部不带 `--testNamePattern`；新增该只读验证输入用于decision-log模板兼容，未增加生产修改文件。用JSON reporter收集全部既有及新增断言、错误与原始输出；每个AC唯一entry，不能仅看exit码、用字段存在代替业务行为或从review结论造测试值。stdout为 `{"entries":[{"acceptance_criterion_id":"AC-TYPE-001","assertions":[{"id":"named-test-evidence","expected":"passed","actual":"failed"}]}]}` 同形JSON；actual来自真实匹配测试事实，示例不是预期通过值。

- **AC聚合规则（T012唯一最终writer）**：同一AC跨pair出现时，把全部关联pair命中的断言并入同一个entry；每条assertion ID由测试文件+完整测试名称确定，保留原始状态和错误，不按“最后一条”覆盖。每个关联pair必须有真实匹配，缺一组就输出缺失/unavailable观察；只有该AC所有要求的断言实际通过，且无缺组/skip/todo/错误，机械部分才可满足。AC-PRD-001合并T001/T002与T005/T006，AC-CHECK-001合并T003/T004与T007/T008，AC-CHILD-002合并T005/T006与T009/T010，AC-META-001合并T007/T008与T009/T010，AC-CLOSE-002合并T007/T008与T009/T010；其他AC按唯一映射表，同组不重复跑文件。
- **既有契约证据槽**：9文件内所有原有测试结果作为AC-CONTRACT-001的独立assertions保存（包括无AC标签的用例），与新增带AC标签的行为断言并存；不得以bundle/manifest检查替代。D030已披露的基线失败保留名称、错误和baseline来源，不因“历史失败”自动豁免。涉及本次checker行为的修复归T003/T004；越界旧缺陷不改断言遮盖，最终如实failed/incomplete。
- **生成物操作**：T011先完成对应source/bundle/catalog更新，再执行 `node tools/cli/repo-skills-manifest.mjs` 写回既有生成物；其gate保留同一生成器的 `--check`，不手工猜manifest字段或hash。

- **D029缺口输出**：AC-ASK-002、AC-ASK-003、AC-CHILD-001只有部分结构/固定夹具观察，完整定性验收的actual明确表达unavailable及原因，不伪造为passed；availability断言只是拒绝假绿，不新增产品oracle。最终canonical可能因此保持incomplete/非pass；验收缺失与机械测试失败分开解释。
- **Evidence consumer**：原始Vitest输出、逐AC结果、aggregate ref/hash留在现有quality/evidence/tests路径；T012由现有acceptance_data command执行器消费。review是独立事实，不能替代测试；不声明少问/变短/省token实测收益。


### FINAL实际入口与证据交付（T012）

执行者只在build-code当前真实outcome生成后，调用已有公共 `run --action=execute --stage=build-code`，把该outcome实际ref放入input的 `receipts.stage_outcomes`（字符串），并保留已有其他真实receipts。验收输入不是public input的新字段：由 `projectAcceptanceExecutionData(tasks,{decisionLog,spec})` 从T012的 `acceptance_role=acceptance`、AC集合及 `acceptance_data` 读取，再经 `acceptanceExecutionFacts→runAcceptanceScenario→executePrivateAcceptance` 执行command。不得先手跑collector再由官方入口重复跑FINAL。

collector内部一次spawn上述9个精确文件，参数加 `--reporter=json --poolOptions.forks.singleFork --no-fileParallelism`，不加名称过滤；子进程预算570000ms，外层600000ms。T011冻结显式 `AC→[{test_file,full_name}]` 映射，AC-CLOSE-002必须同时包含T007/T008声明保存读回与T009/T010归档调用链的selectors，按配对卡要求覆盖每条正反断言；每个selector恰好匹配一次，缺失/重复/skip/todo均不能通过。同AC跨pair取完整并集，不能只取第一项或任一passed；所有无AC标签的原有测试也作为AC-CONTRACT-001断言。新增适配器只在T011实现及静态检查，唯一实际运行由T012触发。

`deriveAcceptanceExecutionAssertions(raw,criterionIds)` 要求全部16AC各一entry、每entry非空且assertion ID唯一，以expected/actual严格JSON相等判定；结果不是由exit或自报pass决定。collector exit0仅表示完整收集、映射、输出成功，即使子Vitest非零也保留真实断言失败；报告损坏/映射缺项/超时/自身异常用非零并保留已采集原件。three qualitative AC的actual用 `{status:"unavailable",reason:"D029..."}`，现有comparator会产生failed质量事实，报告须解释为证据不足，不能假称runtime原生支持独立unavailable验收终态。

现有executor自动保存 `quality/evidence/stage-quality/build-code/acceptance-stdout-<sha>.bin`、stderr原件、逐AC叶 `<AC-ID>-<sha>.json` 及 `quality/facts/<digest>.json`；叶内execution_binding绑定真实outcome/actor，由freshness从原stdout重新推导断言进行认证。T012从真实返回叶读取共同stdout ref/hash，`task.readRecordBytes(stdoutRef)`验hash后，使用既有 `kernel.publishCanonicalRecord("quality/evidence/build-code/T012/final.json",bytes.toString("utf8"))` 保存交付副本。final.json不是新权威；正式引用仍为原leaf/fact/outcome。固定副本已有不同字节则保留冲突，不覆盖、不把副本存在当完成。

## Rollback and Recovery

### 删除证明（计划，未执行）

本计划删除范围仅为既有cleanup处理的专属任务worktree/任务分支，以及测试自己创建的临时夹具；不删除主仓当前材料、母/兄弟材料、旧review/outcome或历史记录。T009/T010须先证明merge和push成功、主仓与远端 `specs/<task-id>/` 完整树及字节与交付版本一致，再执行cleanup；缺任一证明不得删除唯一副本。删除后读回worktree目录与登记、任务分支均已清理，材料仍在主仓同相对路径。后续归档的git mv不是删除证据替代品：须核对源/目标完整树一致、归档提交可回查，冲突或部分移动不覆盖。T009/T010记录逐动作授权/结果、真实文件树、分支和远端probe；未执行本节只证明测试设计具备该边界，不是删除已发生或已通过的证据。

- **Global recovery rule**：只回撤本次具体改动；保留当前四材料、已认证不可变事实、原review与失败结果。不得reset用户dirty修改。
- **Irreversible boundaries**：commit/merge/push/archive/cleanup均须实际单独授权；build-plan确认不授予其中任何动作。测试只能删除其创建的临时repo。
- **Recovery owner**：对应Phase执行者处理边界内失败；产品歧义回材料owner；provider/host不可用保留attempt，不整阶段重跑。

### Engineering Risk Handoff

- **Affected IDs**：下表列明全部受影响FR/AC/T；RISK-05涉及全部FR。
- **Trigger**：触发条件按下表逐项处理，不用出现任意unknown就冻结整个任务。
- **Consequence**：可能提前归档/删除唯一副本、旧产物被继续消费、缺来源被误报通过。
- **Mitigation or STOP**：先修边界内实现；越界或新产品决定回对应材料owner，不制造新的gate。
- **Handling Stage**：build-code处理已规划实现；verify-code只披露OPEN-03/04/05与收益、定性验收缺口。
- **Verification**：各pair的命令/oracle及T012逐AC事实；未经测试或不可用不标完成。

| ID | Affected IDs | Trigger / consequence | Mitigation / handling Stage / verification |
| --- | --- | --- | --- |
| RISK-01 | FR-CLOSE-001、T009/T010 | 四步仍触发archive或completed写点 | D031/D032精确consumer测试；build-code修复，AC-CLOSE-001/003读回 |
| RISK-02/03 | AC-ASK-001、AC-PRD-001、T002/T006 | 结构合规不等于实际少问变短 | verify-code保留unknown；无数字篇幅/收益承诺 |
| RISK-04 | AC-TYPE-001、T001/T002 | 声明错误或中途改型沿用旧内容 | build-code按当前内容重新处置；旧hash失效不能替代证据 |
| RISK-05 | 全部FR、T012 | 试图补新AC或把定性proxy当完成 | verify-code按D029披露，源AC02/06/11/18与执行纪律维度不假绿 |
| PLAN-RISK-001 | FR-REFLECT-001、T007/T008 | optional槽被误当已有producer | 执行实际调用片段并保存→读回，宿主无能力明确unavailable |
| PLAN-RISK-002 | AC-CLOSE-001、T009/T010 | cleanup前主仓/远端未保全材料 | D032已确认；缺读回不得删除唯一副本 |

| Deferred / open | Owner | Trigger | Handoff / consumer | Close / retain condition |
| --- | --- | --- | --- | --- |
| OPEN-01 | build-plan | 原固定五步妨碍不归档 | T009/T010；D031/D032 | 原方向歧义已解；实现满足AC-CLOSE-001后保持该事实，不能据此写完成 |
| OPEN-02 | build-plan | 修复checker后读到旧116条告警 | T003/T004、verify-code风险披露 | 保留旧缺字段；不补造；永久N/A或替代校验需另有真实决定 |
| OPEN-03 | 用户 | 阶段完成来源无法认证 | verify-code与T012交接 | 获得真实来源或用户接受未完成；此计划不补过去executor |
| OPEN-04 | 用户 | 下游材料改变上游快照 | verify-code披露，不转派实现 | 改绑定或明确当次有效须后续决定；不反复重绑 |
| OPEN-05 | 用户 | direction/open散文字碰撞 | verify-code披露，不转派实现 | 后续结构化/区分文本命中决定；不改措辞绕检测 |
| OPEN-06 | build-spec | 原术语/ADR缺长期落点 | CONTEXT.md与ADR0027，T011只核对 | 已resolved，ADR仍proposed，不宣称治理实施完成 |
| DEFER-01 | 用户 | 显式取消人工归档确认 | 规划归档行为；T010/T012披露 | 否则永久保留人工授权 |
| DEFER-02 | 用户 | 第一个调研/可行性/设计类型任务 | 类型提问编排；T002 | 未决定前不加规则/受控值 |
| DEFER-03 | 用户 | 用户要求重做或旧材料进入实施 | 未来子任务；T006 | 否则旧材料只读 |
| DEFER-04 | 用户 | 无法读回未归档收口成为真实痛点 | 既有逐动作事实；T010 | 否则不新增独立收口记录 |


### 本次独立审查处置

canonical result：`quality/reviews/results/build-plan-simple-b07acf28-2a6c-56bf-a288-73db866056eb.json`；三provider均完成，共9条建议，不是质量通过。修订后的计划由主会话处置、最后spec-analyze核对，不把原review的snapshot改成新版本。

| Finding | 处置 | 落点/依据 |
| --- | --- | --- |
| F-05194de151f6 | fixed | T001/T002补类型选择→显式写入→读回→提问及改型重处置；unknown只暂停类型相关分支，不增加全局工作gate |
| F-7832c5f5a56f | fixed | 同pair补六类方向槽位及真实回答/留空理由正反例 |
| F-4e2c8c91ffa1 | fixed | T005/T006除字节比对还检查close调用、文件move/delete及树前后 |
| F-32b22236f3ea | fixed | T008给定payload、真实kernel调用、内容寻址路径、读回和报告/交接消费者 |
| F-3495bbf56903 | fixed | T011明确先生成manifest再check |
| F-6f9251dce58f | fixed | T012唯一entry保留跨pair所有断言，缺selector/失败不可被其他pass覆盖 |
| F-cd8280ff256b | fixed | FINAL不带名称过滤，9个受影响文件含decision-log原有contracts；所有旧断言进入AC-CONTRACT-001，基线失败不豁免 |
| F-d87d16de9605 | fixed | 公共build-code execute消费T012 acceptance_data，自动真实leaf/fact与stdout认证，final.json只是验hash后的交付副本 |
| F-61a3c088952f | fixed（D033设计修订；当前增量发现见下表） | 用户通过D033允许窄扩展现有close；spec同步FR-CLOSE-002/003、SCN-004和AC-CLOSE-002；下文与T009/T010明确清理后主仓入口、声明保存读回、操作确认、archive+commit双授权、独立push、严格步骤与失败恢复。原review保留，不代表产品已实现 |

F-61a3c088952f的方向处置来源为D033真实用户答复；owner=当前build-plan，consumer=build-code T009/T010。当前设计必须使用有效声明原话，不能新增机器完成枚举或撤回链；已有 `confirmClosePlan` 只记录真实close操作确认，声明不能冒充plan批准。材料修订与原review分别保留；当前增量复核已返回，新增发现按下表处置，不把旧结论标为当前通过。

D034是用户另行授权、用于当前阶段收尾的工具修复，明确不属于本plan的产品交付声明、29文件实施范围、20FR/16AC或T012 collector；不得用本计划完成宣称其验证完成，也不把已完成工具工作重新排成未来产品卡。其独立执行记录由当前主会话/运行时修复执行者负责：唯一4文件见宪法限定例外；在正式阶段outcome发布前使用经独立审查与针对性测试的已提交runtime。原始记录为 `quality/evidence/build-plan-input/d034-runtime-review-observation.json`，本地提交 `34faed95`，main同步提交 `89773aaa`。准确验证命令为 `./node_modules/.bin/vitest run tests/contract/stage-handoff.test.mjs tests/contract/execution-outcome.test.mjs tests/contract/stage-completion.test.mjs tests/contract/host-outcome-bridge.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；taskWT实际101 passed/exit0，main整合后103 passed/exit0、58.95秒且两侧测试完整，记录于 `quality/evidence/build-plan-input/d034-git-integration-observation.json`，不填入产品AC。原RED/GREEN、异源bare审查与main读回分别保留。修复若失败，仅修这4文件并跑该范围，不重复T012；回撤须另获Git授权并保留旧outcome/失败事实，不覆盖历史。正文outcome不能把后置hook当先决条件，最终handoff仍读真实hook结果；该独立工具事实不改变12卡pending。


### D033增量审查的当前处置

canonical result：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`。3个provider返回6条原始发现，其中F-906524e7710c与F-a36ca7a6098c指向同一遗漏；保留两条原件，不改review身份或声明无发现。以下fixed仅表示计划设计已修订，产品测试仍未执行，最终人类确认另行真实取得。

| Finding | 当前处置 | 修订位置与可检查结果 |
| --- | --- | --- |
| F-d5c656b1d832 | fixed | Quick Read、依赖图和T001显式消费现有build-plan最终确认及正式run；绑定当前task/四材料revision/snapshot与源hash；确认前不执行产品卡，不新增gate |
| F-1490b26a83aa | fixed | 明确移出本计划产品交付声明及T012 AC集合；D034只列为另行授权且独立执行的工具事实，具备owner、4文件、准确命令、原始观察、Git身份与恢复边界；不把已执行工具工作伪排为产品待执行任务 |
| F-1cea847ef96f | fixed | 第6步唯一原始ESM块→reportFactsAndHandoff→真实readReflectionForReport→report/handoff→接手重读；T007/T008执行源码原件和实际入口，不复制snippet或只测optional槽 |
| F-84b983bd6cff | fixed | 人工caller前置条件、当前声明展示与现有操作确认显式绑定；T009/T010验证真实prepare/confirm/authorize/execute拒绝链；自然语言理解不由布尔测试冒充，未实测边界显式保留 |
| F-906524e7710c | fixed | AC-CLOSE-002合并T007/T008与T009/T010；T011固定map与T012全部selectors同entry，缺组不得满足 |
| F-a36ca7a6098c | fixed | 同上，另同步T012的D033引用；原provider分级保留，不自行删减原发现 |


## Implementation Order

P1（声明和事实表达）→P2（消费类型、PRD与复盘）→P3（最后交付、保全材料）→P4（源稳定后hash与聚合）。每个文件只归一个Phase；同Phase内有共享文件的卡串行。详细动作、测试设计与执行区只在tasks.md。

## Dependencies and Parallelism

- **Dependencies**：既有build-plan当前材料最终确认（正式run已读回）→T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011→T012。前者提供失败断言或稳定输入；最后两卡依赖所有source稳定。
- **Parallel work**：N/A — 本计划不声明并行写入；代码锚点核查与独立审查可独立上下文执行，测试重活派子代理，主会话收摘要。
- **External dependencies**：无新库/服务；独立review使用已配置broker，保留实际provider/model/transport；不可用不变pass，不阻止修复。

## Requirement and Verification Traceability

Source列同时保留上游旧AC编号作为别名，当前验收仍只按spec的16张命名AC卡；旧编号不新增验收项，D029定性缺口不因映射而变成已覆盖的测试结论。

本表是唯一映射权威；tasks按此投影，不另建第二张总映射。原始source AC-01…18 与规格AC区分；OI/R来源的当前解释以decision-log现行决定为准，旧D012/013/014/021机器判定部分由D027取消。

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 AC-02 AC-03 AC-14 AC-15 AC-16 AC-18；D-001 D-002 D-003 D-004 D-005 D-008 D-009 D-026 | FR-TYPE-001 FR-TYPE-002 FR-ASK-001 FR-ASK-002 FR-ASK-003 FR-DOC-001 | AC-TYPE-001 AC-ASK-001 AC-ASK-002 AC-ASK-003 AC-PRD-001 | P1/T001/T002 | none | `tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`workflows/make-decision/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/stage/stage-content-contracts.mjs` | `node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-TYPE-ASK |
| D-023 D-024 D-025 D-030 | FR-CHECK-001 FR-CHAIN-001 | AC-CHECK-001 AC-CHAIN-001 | P1/T003/T004 | T002 | `tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tools/cli/check-decision-log-chain.mjs` | `node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-TRUTHFUL-END |
| AC-04 AC-05 AC-06 AC-11 AC-13 AC-16 AC-17；D-005 D-006 D-007 D-014 D-015 D-017 D-018 D-021 D-027 | FR-DOC-001 FR-PRD-001 FR-PRD-002 FR-PRD-003 FR-CHILD-001 FR-CHILD-002 FR-CHILD-003 | AC-PRD-001 AC-PRD-002 AC-CHILD-001 AC-CHILD-002 AC-CONTRACT-001 | P2/T005/T006 | T004 | `tests/contract/spec-prd-skill-contract.test.mjs`、`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md` | `node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-PRD-HANDOFF |
| AC-07 AC-09 AC-12；D-010 D-016 D-019 D-027 D-033 | FR-REFLECT-001 FR-CHECK-001 FR-CLOSE-003 | AC-REFLECT-001 AC-CHECK-001 AC-META-001 AC-CLOSE-002 | P2/T007/T008 | T006 | `tests/contract/build-prd-review-contract.test.mjs`、`workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json` | `node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-PORTABLE-REFLECTION |
| AC-08 AC-09 AC-10 AC-12 AC-17；D-011 D-012 D-013 D-016 D-027 D-031 D-032 D-033 | FR-CLOSE-001 FR-CLOSE-002 FR-CLOSE-003 FR-CLOSE-004 FR-CHILD-003 | AC-CLOSE-001 AC-CLOSE-002 AC-CLOSE-003 AC-CHILD-002 AC-META-001 | P3/T009/T010 | T008 | `tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`、`core/task-close.mjs`、`tools/cli/task-close.mjs` | `node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism` / ORACLE-UNARCHIVED-CLOSE |
| AC-13 AC-16；D-017、D-016 | FR-CONTRACT-001 | AC-CONTRACT-001 AC-META-001 | P4/T011 | T010 | `skills/decision-log/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/catalog.yaml`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`、`tests/fixtures/planning-workflow-hardening-acceptance.mjs` | `node --input-type=module -e 'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; import yaml from "js-yaml"; import {validateSkillBundle} from "./runtime/adapters/local-skill-resolver.mjs"; const c=yaml.load(readFileSync("skills/catalog.yaml","utf8")); for(const n of ["decision-log","spec-prd"]){const b=validateSkillBundle(process.cwd(),"skills/"+n+"/skill-bundle.json","skills/"+n+"/SKILL.md"); assert.equal(c.skills.find(s=>s.name===n).local_bundle_hash,b.bundleHash);}' && node tools/cli/repo-skills-manifest.mjs --check && node --check tests/fixtures/planning-workflow-hardening-acceptance.mjs` / ORACLE-CONTRACT-HASH |
| D-019、D-022、D-028、D-029、D-032；源AC01…18 | 全部20FR | 全部16AC（含unknown） | P4/T012 | T011 | `tests/fixtures/planning-workflow-hardening-acceptance.mjs` | `node tests/fixtures/planning-workflow-hardening-acceptance.mjs` / ORACLE-FINAL |

D-018作为只读边界、D-020作为本任务普通实现性质、D-022/028作为执行纪律/来源口径、D-024/025作为已存在上游改动，由相应卡和T011/T012核对；不为这些决定造无来源行为卡。D-029是明确保留的验收缺口，不以新增FR/AC填平。SCN001→T001/002；SCN002→T005/006；SCN003→T007…010；SCN004/006→T009/010；SCN005→T003/004；SCN007只有既有流程事实，按D029不新增验收。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 类型/方向规则 | workflows/make-decision/SKILL.md、skills/decision-log/SKILL.md及模板 | change | T002 | 真实提问producer及当前材料约定 |
| 五阶段末披露 | 五个已列明workflows的SKILL.md | change | T004 | 复用现有outcome/manifest逐项报告，不改schema |
| PRD/非阶段收尾 | spec-prd两文件、build-prd两文件 | change | T006/T008 | 模板token保持，补非内容调用 |
| 交付 | core/task-close.mjs、tools/cli/task-close.mjs | change | T010 | 既有owner内窄裁剪，旧模式不变 |
| bundle / catalog / inventory | P4精确文件清单 | change | T011 | 稳定后逐文件SHA与bundleHash；NEW测试fixture登记consumer/删除条件 |
| 宪法 / 术语 / ADR | CONSTITUTION.md、constitution-checklist.md、CONTEXT.md、docs/adr/0027-planning-task-question-boundary.md | no change | T011只读 | 条款与OPEN06已给出边界，不重开治理 |
| 旧历史 / task schema / UI | DO NOT TOUCH所列文件 | no change | 所有卡 | 不增加新authority/状态/界面 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"7d028c2919d2ef7749489d4a716be273a0dd986e7ea795a6b052c25a8d5dc12f","id":"CONSTITUTION","version":"1.8.0","clause_count":22}`
- **F1**：提问/复盘/分报由现有主会话与skills承担，不在核心新增编排器。
- **F2**：原调用兼容；D033窄加现有close参数，JSON schema不变；声明/操作确认分离，类型仅当前材料。
- **F3**：四材料可读支持继续；正式发布身份/hash仍严格，不用旧receipt挡修复。
- **F4**：独立review findings逐条处置；一般质量缺口不锁工作。
- **F5**：无新增推进gate；测试gate_cmd只是命令。
- **F6**：证据进现有外置task quality；正式写用真实干净runtime身份，不伪称dirty为HEAD。
- **F7**：build-plan最终由真实用户确认；D032/D033为产品决定，D034为工具修复，不授予本次Git交付或物理close。
- **F8**：复用模板、kernel、close executor；不造type registry/新mode。
- **F9**：零匹配、空复盘、missing executor、D029缺口均不假绿。
- **F10**：DEC004仅保留一份必要test-only适配，非新框架；无收益数字。
- **F11**：已有owner/consumer中窄扩展；NEW测试fixture有删除条件，辅助缺口不挡修复。
- **D034外部工具修复边界（非本计划产品交付）**：仅 `runtime/stage/stage-agent-outcome-adapter.mjs` 与 `tests/contract/stage-handoff.test.mjs`、`tests/contract/execution-outcome.test.mjs`、`tests/contract/stage-completion.test.mjs` 为当前单独授权的工具修复边界；owner=当前stage runtime，consumer=现有session recorder/runner。测试再覆盖既有 `host-outcome-bridge.test.mjs`（只读）；不并入本12卡、不扩OPEN04/05或修改其他正式判据。F3/F6/F9要求正式启用前真实验证已提交运行代码，F4/Q3要求独立审查。
- **Q1**：计划测试非已测；逐AC、review及交接缺失时不宣称完成。
- **Q2**：实现、正式stage、acceptance、release、physical close分别记录。
- **Q3**：wh-review异源独立上下文；内联工程/一致性lens不自封质量裁决。
- **S1**：继续使用既有Vitest/Git/TaskKernel，不造轮子。
- **S2**：只作必要的本地portable规则改造，符合非stage边界。
- **S3**：本次不引入外部技能版本；修改本地包后检查当前包闭包/来源登记，不无关升级。
- **S4**：实际步骤和provider指标走现有记录；缺usage就unavailable，不推测节省。
- **S5**：按冻结packet与卡边界分工，重测试交子代理。
- **S6**：沿用现有spec-prd/五阶段/TaskKernel成熟路径，无需新方案调研。
- **S7**：五stage及build-prd portable身份不变；第6步内补非内容工作。
- **S8**：无宿主私有会话扫描、固定全局路径或新增专用dispatcher。

## Phase P1 — 任务类型、提问与真实阶段披露

### Goal

提问前从唯一声明选边界；逐项分报产物与完成事实，链检查不再零匹配假绿。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/stage/stage-content-contracts.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Tasks

- T001：RED 类型声明与提问边界
- T002：GREEN 类型声明与提问边界
- T003：RED 逐项阶段披露与零条目链检查
- T004：GREEN 逐项阶段披露与零条目链检查

### Verify

ORACLE-TYPE-ASK / ORACLE-TRUTHFUL-END — 本phase使用下列同名任务oracle；命令与事实路径如下。

T001→T002：`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-TYPE-ASK；`quality/evidence/build-code/T001-T002/pair.json`。

T003→T004：`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-TRUTHFUL-END；`quality/evidence/build-code/T003-T004/pair.json`。

### Knowledge

类型是当前决策材料的一条声明；旧绑定失效不等于已重新处置。已有 D024/D025 改动保留，不重写旧历史。

### STOP

输入缺少真实来源、RED为setup错误、GREEN需放宽断言、发现越界文件或新产品决定时返回对应四材料owner。

### Done

T001、T002、T003、T004 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。没有真实执行前全部pending；不把计划中的预期结果当成实测。

### Risks and rollback

RISK-04、OPEN-02/04/05：类型误判、链字段旧缺失、快照/文本碰撞。仅回撤本phase新增分支与指令，不删除旧告警，不伪造旧产物。

## Phase P2 — 方向层 PRD、子任务接手与非阶段复盘

### Goal

保留16字段与完整旅程覆盖；子任务只读接手；末步生产、保存并读回复盘，不接正式stage。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json`、`tests/contract/spec-prd-skill-contract.test.mjs`、`tests/contract/build-prd-review-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Tasks

- T005：RED 方向层 PRD 与子任务最小接手
- T006：GREEN 方向层 PRD 与子任务最小接手
- T007：RED 非阶段复盘生产、保存与读回
- T008：GREEN 非阶段复盘生产、保存与读回

### Verify

ORACLE-PRD-HANDOFF / ORACLE-PORTABLE-REFLECTION — 本phase使用下列同名任务oracle；命令与事实路径如下。

T005→T006：`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-PRD-HANDOFF；`quality/evidence/build-code/T005-T006/pair.json`。

T007→T008：`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-PORTABLE-REFLECTION；`quality/evidence/build-code/T007-T008/pair.json`。

### Knowledge

spec-prd仍是唯一PRD内容writer；第6步只补非内容复盘与报告，规划复盘不是正式stage-reflection。

### STOP

输入缺少真实来源、RED为setup错误、GREEN需放宽断言、发现越界文件或新产品决定时返回对应四材料owner。

### Done

T005、T006、T007、T008 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。没有真实执行前全部pending；不把计划中的预期结果当成实测。

### Risks and rollback

RISK-02/03/05：材料变短与可接手性未实跑；通用record可用不等于有调用。回撤本phase文本与调用片段，保留已产生不可变复盘事实；失败如实unavailable。

## Phase P3 — 规划任务四动作与延后人工归档

### Goal

声明为规划任务的默认收尾执行四动作、不归档、不写completed；主仓同相对路径保留后正常cleanup。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Tasks

- T009：RED 四动作、不归档与人工声明
- T010：GREEN 四动作、不归档与人工声明

### Verify

ORACLE-UNARCHIVED-CLOSE — 本phase使用下列同名任务oracle；命令与事实路径如下。

T009→T010：`node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-UNARCHIVED-CLOSE；`quality/evidence/build-code/T009-T010/pair.json`。

### Knowledge

D031允许窄裁剪archive；D032允许主仓同相对路径保留后正常cleanup。plan.steps与逐动作记录供恢复，不新增收口完成对象。

### STOP

无法区分新规划收尾与显式legacy planning、archive执行器改动超出D033限定的两步分支、缺独立授权、主仓读不回材料或需要新增模式/字段时返回plan/source owner；不扩大操作范围。

### Done

T009、T010 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。没有真实执行前全部pending；不把计划中的预期结果当成实测。

### Risks and rollback

RISK-01与D032：遗漏固定五步检查、提前cleanup、重复动作。保持原有默认五步逻辑可恢复；对已发生物理动作只按逐项事实补做，禁止逆改历史或删除材料。

## Phase P4 — 单点登记同步与一次最终聚合

### Goal

重算受影响bundle与登记，提供现有acceptance command消费者可读的测试结果，不掩盖D029未决验收。

### Files

- **NEW**：`tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **MODIFY**：`skills/decision-log/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/catalog.yaml`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Tasks

- T011：登记同步与有界结果适配
- T012：FINAL 一次当前快照聚合

### Verify

ORACLE-CONTRACT-HASH / ORACLE-FINAL — 本phase使用下列同名任务oracle；命令与事实路径如下。

T011 使用 `node --input-type=module -e 'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; import yaml from "js-yaml"; import {validateSkillBundle} from "./runtime/adapters/local-skill-resolver.mjs"; const c=yaml.load(readFileSync("skills/catalog.yaml","utf8")); for(const n of ["decision-log","spec-prd"]){const b=validateSkillBundle(process.cwd(),"skills/"+n+"/skill-bundle.json","skills/"+n+"/SKILL.md"); assert.equal(c.skills.find(s=>s.name===n).local_bundle_hash,b.bundleHash);}' && node tools/cli/repo-skills-manifest.mjs --check && node --check tests/fixtures/planning-workflow-hardening-acceptance.mjs`，expected_exit=0；T012 使用 `node tests/fixtures/planning-workflow-hardening-acceptance.mjs`，expected_exit=0，ORACLE-FINAL，证据 `quality/evidence/build-code/T012/final.json`。退出0只表示结果收集成功，不能把 unavailable AC 算通过。

### Knowledge

源文件稳定后才重算hash；逐AC原始证据与provider/review事实分离。

### STOP

测试未选中任何断言、final只按进程exit制造逐AC通过、模板token被删、需要新增生产框架或补D029 oracle时停止该卡并回计划。

### Done

T011、T012 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。机械测试可通过与三个定性AC仍unavailable同时成立；不据此宣称整体验收或发布。

### Risks and rollback

FR-CONTRACT-001、RISK-05：hash与当前文件错配、把定性缺口漂绿。重算仅本次改动闭包；收集器失败保留原输出与部分报告，只清它创建的临时目录。
