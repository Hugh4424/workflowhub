# 阶段交互与交接完整性增量规格

## 1. 目标与继承关系

本规格是 `multica-flow-reliability-final` 的窄后继增量，只补 R6 Canary 已证明未闭合的交互、交接和执行遵循问题。前序 accepted spec 与实现记录保持不可变；前序其余要求继续有效，但本规格明确撤销并取代前序 FR-019 中恢复旧 Issue 的子句、AC-020，以及 plan/tasks 中对应的 ZHI-102、ZHI-184 恢复任务。最终验收不得再要求或执行这两个旧 Issue。

目标是在下一次外部项目 Canary 中证明：需要用户处理时一定能收到当前 Issue 的真实 member mention；主 Stage Skill 要求的用户交互不会被模拟或静默跳过；Stage、Phase 和返工无需外部提醒即可继续；宿主无关的 `build-code` Skill把完整阶段写成可组合的“阶段协调”和“Phase执行”两部分，Multica只在 instructions中把两部分分别交给现有 Agent执行。

## 2. 系统边界

- WorkflowHub 继续保持宿主无关，不得包含 Multica API、Issue、mention、status、用户 UUID 或队列逻辑。
- WorkflowHub 只手术式修改现有 `workflows/*/SKILL.md`、必要的 `skill-deps.yaml`、现有 `skills/wh-review` ownership metadata/contract、既有 human brief/closure metadata或合同测试，并继续保持宿主无关；这些仓库文件是 Stage Skill 的唯一来源。`wh-review` 改动只允许消除组件双重所有权，不增加 reviewer或执行能力。
- Multica 只同步已经审查通过的 WorkflowHub Skill closure，并修改现有 Agent/Squad instructions；不得在线创造与仓库不同的 Skill 合同，不得修改 Agent provider、model、runtime 或 Multica/Codex底层。
- 不新增 Agent、Squad、Skill、schema、后台服务、组件注册表、通知系统、通用状态机或硬质量门。
- WorkflowHub 的 `build-code` Skill不得出现 Multica Agent、Issue、mention或派发关系，只定义可组合的“阶段协调”与“Phase执行”职责；同一个 Agent的宿主可以按顺序执行两部分，保持原有完整 build-code能力。
- Multica 中 Coder绑定与 Code Builder相同 ID的现有 `build-code` Skill，不新增第二个 Skill。Multica instructions只做角色映射：Code Builder读取阶段协调部分，负责拆 Phase、派发、phase-gate、最终全树审查、Stage run/accept和verify reopen；Coder读取Phase执行部分，负责当前 Phase的开发、真实测试、canonical证据、Phase独立 `wh-review`与finding修复。Coder不得拆分/启动其他 Phase，不得做最终全树审查、Stage run/accept/reopen、commit、merge、push或close。
- ZHI-102、ZHI-184 不恢复，属于本任务非目标。
- 3rd-review provider 只按当前配置选择，不固定、不覆盖 provider 或 model。

## 3. 功能要求

### FR-001 用户待办必须真实提醒

Agent 只有在需要用户回答或授权时，才在当前 Issue 发布决策卡并使用 Multica 现有 member mention 真实 `@志鹏`。决策卡必须包含：当前状态、问题、推荐项、推荐理由、2～3 个互斥选项、每项后果和风险、下一步负责人。不得用开放式填空代替选项。无需用户处理时必须明确写“用户操作：无需处理”，且不得 mention 用户。

### FR-002 Stage 交互映射

当绑定的主 Stage Skill要求 `ask`、`wait` 或 `present` 时，Multica Agent 必须把该动作映射到当前 Issue comment；不得在内部推理中模拟用户回答。

- make-decision 的三次 `talk-with-zhipeng` 必须保持三个独立 invocation。Round 1 的方向问题、Round 2 的可见 checkpoint、Round 3 的审查 finding 处理结果均须在当前 Issue 可见；只有答案会改变方向时才 `@志鹏` 并等待。
- `grill-with-docs` 必须完整执行，并在完成卡中写明结果、修改的上下文文件或“无文件修改”；不得只声称已读取 Skill。
- build-spec 必须先执行一次实质歧义扫描。`skill-deps.yaml` 与主 Skill统一把 `spec-clarify` 定义为 `conditional/clarification`：存在会改变范围或验收的歧义时调用它，在当前 Issue 发布决策卡并 `@志鹏`；不存在时记录 `spec-clarify: skipped — no material ambiguity` 后继续，不制造无意义问题。
- build-plan、build-code、verify-code 出现主 Skill规定的 `ask`、`wait` 或 `present` 时，同样适用本条 Issue交互映射，不得只在内部停止或等待。

### FR-003 组件所有权与执行事实

每个 Stage 完成卡必须以该 Stage 当前 `skill-deps.yaml`、主 `SKILL.md` 与 `wh-review` manifest/stage plan的一致 ownership为权威，列出 Stage-owned `always` 组件执行结果，以及 `conditional` 组件的 `executed` 或 `trigger=false — <reason>`。同一组件在同一 Stage不得同时是 Stage-owned和review-owned。该清单使用现有 Issue comment/human brief，不新增 receipt、schema或 runtime gate；不得只依赖 Agent自报而不与正式产物或 review refs交叉核对。

只由 `wh-review` 拥有的 reviewer lens（包括 `simplicity-guard`、`review`、`spec-analyze`、`plan-*`、`intake-*`、`qa-only`、`verify-change`）不得被直接重复调用；它们的执行事实以现有 review bundle、provider输出和 result refs 为准。Coder可以作为当前 Phase 的 `wh-review` runner调用者，但不得充当 reviewer或自行改变 verdict。

现有所有权必须统一：

- build-plan 的 `spec-analyze` 只作为 `wh-review` lens，不再由 Stage独立重复调用。
- build-code 的 `test-routing-advisor`、`diagnosing-bugs`、`review-response` 是 Phase执行部分的 conditional组件，不是 reviewer lens；当前 Phase触发时由 Phase执行者按 `build-code` Skill执行并记录结果。
- `test-strategy` 是 verify-code Stage-owned conditional组件，仅在 accepted spec/plan要求 UI、高风险或多层测试路由时执行；它不运行产品测试、不属于 build-code、不得作为 provider lens，也不绑定给 Coder。
- verify-code 的 `isolated-browser-qa` 是 UI范围下的 Stage-owned conditional组件，不属于 provider lens。
- `qa-only`、`verify-change` 只属于显式 standalone diagnostic review，不是正常 verify-code Stage必须执行的组件。

### FR-004 双向 Stage handoff

Stage 完成时必须：

1. 在当前 Stage Issue 发布一条完成卡，包含结果、正式产物 refs、测试/审查证据、下游依赖、未解决风险、下一责任人和用户状态。
2. 工头把精简 handoff 写入既有下游 Issue description 或 comment；不复制完整 spec、日志或 hash 流水。
3. 工头在父 Issue 写一条可读进度和当前 Stage/下游 Issue 链接，使上游能看到下游进展。

正常 accepted 仍由原生 barrier推进；不得重复 mention。上游输入错误继续使用既有 `上游 comment + @上游 Agent → 修复 → 原下游 comment + @原下游 Agent` return handshake。

### FR-005 Coder Phase 完整执行与返回

`build-code` Skill必须提供宿主无关、可组合的阶段协调部分和Phase执行部分；统一的开发、测试、Phase证据、独立审查、finding修复和返回规则只能写在Phase执行部分。阶段协调者给Phase执行者的 Phase Card只传当前 Phase事实：project/task/phase身份、目标、AC IDs、认证 Workspace、允许文件、baseline、非目标、适用时的 RED预期、精确测试命令、必要回归范围、条件组件触发事实和上游finding；不得复制流程步骤或provider规则。project/task/phase、Workspace和baseline必须从 authenticated StageContext与accepted records原样复制，禁止从 Issue标题/描述、cwd或目录扫描推断。在单 Agent宿主中，同一执行者依次完成两部分，不需要派发或handoff。

Phase执行者必须按 `build-code` Skill的 Phase执行部分和 Phase Card事实完成：适用的 RED → 最小 GREEN → 聚焦测试 → 必要回归 → scoped diff → canonical Phase证据 → 当前 snapshot/material的正式 `wh-review`。若审查返回 `revise_required`，Phase执行者在原 Phase内修复、捕获新证据并只审查新的身份；不得先返回阶段协调者再等待重新派发。只有 Phase review通过且 phase-gate材料齐全后才能返回。Multica 的 Coder把该流程全部留在同一个 Phase子 Issue内。

1. 在当前 Phase Issue 发布实现、AC、RED/GREEN、测试、diff 和风险摘要。
2. 在父 build-code Issue 发布精简返回摘要，并使用一个真实 Agent mention 唤醒 Code Builder。
3. 确认两条 comment成功后再把 Phase设为 `done`。

Phase执行者必须按 Skill固定流程继续复用现有 `capture-tests`、canonical implementation receipt和 `wh-review`入口；宿主 comment不是正式证据。现有 runtime只缺少安全发布 Phase diff/result的公开入口，因此只允许在现有 `stage-runtime.mjs` 增加一个窄命令：认证 Phase身份后，复用 authenticated Workspace、TaskHandle、`createPhaseDiffScan`和canonical writer生成并发布 phase diff scan与phase result。该命令不得重包测试/receipt，不得成为通用publisher，不得接受任意路径、commit range、provider或model，不新增schema或权限系统。阶段协调者从认证 Workspace复核 canonical refs并执行 phase-gate，不重复调用同一 Phase review。

### FR-006 build-code 审查顺序

`build-code` Skill继续是唯一阶段执行合同。Phase执行者必须为当前 Phase的每个 snapshot/material身份执行且仅执行一次正式 `wh-review`；阶段协调者验证其 canonical result并通过 phase-gate后才能启动下一 Phase，不重复审查同一身份。

最终全树审查前，阶段协调者必须从 accepted plan枚举全部 Phase ID，并逐项确认已有匹配 Phase ID、snapshot和material的 canonical Phase review结果；任何 Phase缺失时返回原Phase，不得启动最终全树审查。每个 build-code attempt的最终 snapshot/material只审查一次；snapshot或material改变时只为新身份执行一次，未改变时禁止重审。

### FR-007 自动推进与状态收口

Stage/Phase accepted 或完成后，负责 Agent 必须先发布完成卡，再设置 `done`，让原生 barrier推进。若真实 Agent mention未产生 run，Canary 直接失败，不增加轮询、watchdog 或平台补丁。功能 close 完成后，工头核对所有有效 Stage/Phase为 `done`、废弃项为 `cancelled`、无非终态子 Issue，再将父 Issue设为 `done`。

### FR-008 instructions 保持窄而清晰

所有改动的 Multica instructions 使用短标题、短列表和固定卡片模板，只描述宿主侧 Issue、status、mention、handoff与恢复映射。不得复制 Stage Skill内部步骤、build-code Phase review规则、provider选择或测试策略正文；`build-code` Skill继续是唯一开发流程合同。

## 4. 验收标准

- **AC-001 人工提醒**：Canary 中每条等待用户的 Agent comment均包含从当前 workspace配置解析出的真实 `mention://member/<当前用户ID>`、问题、推荐项、2～3 个选项及后果/风险；无需用户的 comment明确“无需处理”且无 member mention。不存在无 mention 等待或开放式填空。
- **AC-002 make-decision 交互**：Canary 的 make-decision Issue可见 Round 1、Round 2 checkpoint、Round 3 finding处理和 grill完成结果；至少注入一个会改变方向的真实问题，Agent先发决策卡并 `@志鹏`，收到推荐回复后才继续。decision-log 与两路 review refs完整。
- **AC-003 build-spec 澄清**：Canary 的 build-spec 注入一个会改变范围/验收的真实歧义，`spec-clarify` 在当前 Issue 发布决策卡并 `@志鹏`；无歧义时记录 skip reason并继续的路径由聚焦合同测试/fixture证明，不新建第二条 Canary流程。
- **AC-004 组件执行清单**：五阶段完成卡逐项列出 `SKILL.md + skill-deps.yaml + wh-review metadata` 一致确认的 Stage-owned always/conditional组件的 executed/skip事实；同一组件没有双重所有权，review-owned lens只在 review evidence中出现且没有重复调用。聚焦合同测试证明 `spec-analyze`只归 build-plan review，`test-strategy`/`isolated-browser-qa`只归 verify-code条件执行，`diagnosing-bugs`/`review-response`/`test-routing-advisor`只归 build-code Phase条件执行，`qa-only`/`verify-change`只归显式诊断review。清单与正式产物、review refs交叉一致。
- **AC-005 双向 handoff**：Stage 1～4 均有当前 Issue完成卡、下游精简 handoff和父 Issue进度；verify-code 有当前 Issue完成卡、close handoff和父 Issue进度。下游无需再次询问已确认的身份、路径、AC、产物或依赖，上游能从父 Issue找到当前状态和结果链接。
- **AC-006 Coder 独立执行**：WorkflowHub `build-code` Skill源码不含 Multica Agent或Issue语义，单 Agent合同测试证明可顺序执行协调与Phase两部分。Multica Coder绑定现有 `build-code` Skill并只执行Phase部分；两张 Phase Card只含来自认证上下文的当前任务事实，不含流程副本。Coder在原 Phase内完成适用 RED/GREEN、聚焦测试、必要回归、原始输出、scoped diff、canonical Phase证据、正式 Phase review和finding修复，没有拆分/启动其他 Phase，没有执行最终全树review、Stage run/accept/reopen、commit/merge/push/close，并在父 build-code Issue用真实 Agent mention一次性返回。canonical refs均绑定当前 Phase snapshot；finding修复产生新 snapshot/material时只允许该新身份一次review，原身份禁止重审；Code Builder只执行协调部分和phase-gate，不重复审查。
- **AC-007 审查次数**：每个 Phase的每个 snapshot/material身份恰好一个正式 review attempt；下一 Phase只在前一 phase-gate通过后开始；每个 build-code attempt的最终 snapshot/material恰好一个最终全树 review。相同身份重复调用只复用同一 result，不产生 provider调用。
- **AC-008 自动推进**：Canary 无任何“继续、提醒、恢复、别跳步骤”等外部救火 comment。允许的 member comment仅是对 Agent已发决策卡的推荐选项回复和独立 close授权。任何额外 member提醒均使 Canary失败。
- **AC-009 返工与收口**：Canary包含一次确定性 verify failure、唯一 controlled reopen、原 Phase/Stage复用、fresh verify、完整 close；全部有效 Issue最终 `done`，无非终态子 Issue，临时 Multica project、worktree和branch清理完成。
- **AC-010 边界回归**：WorkflowHub 在无 Multica 环境通过核心测试和Skill closure；源码不含新增 Multica API/Issue/mention/status依赖；Multica Agent provider/model/runtime和Skill ID保持不变。
- **AC-011 instructions 可维护性**：Prompt窄审查证明改动只包含宿主映射和卡片模板，标题/列表结构清楚；没有复制 Stage Skill步骤、固定 provider/model或新增第二份流程合同。

## 5. 来源覆盖

- 用户要求大白话、推荐选项与真实 `@我`：FR-001，AC-001。
- 用户要求自行处理、上游 return 和只在明确阻断找人：FR-004/007，AC-005/008/009。
- 用户要求上下游都看见产物、证据和依赖：FR-004，AC-005。
- 用户要求 Coder在 Phase内完整负责开发、TDD、测试、独立审查、finding修复和留痕：FR-005/006，AC-006/007。
- R6 的 talk/grill/spec-clarify 静默跳过：FR-002/003，AC-002～004。
- R6 的 Phase review遗漏和重复审查风险：FR-006，AC-007。
- 用户撤回旧 Issue恢复、禁止固定 provider/model：系统边界，AC-010。
- 用户要求 instructions 可维护：FR-008，AC-011。

## 6. 明确排除

- 不强迫每个 conditional Skill都提问；没有实质歧义时记录 skip reason。
- 不要求每个子 Skill各发一条 comment；Stage完成卡提供一次简短执行清单。
- 不新增 Coder专用 Skill，不把流程复制进 Phase Card；Coder复用现有 `build-code` Skill的固定 Phase角色，不单独绑定 `test-strategy` 或 `wh-review`。
- 不新增组件执行台账、receipt schema、通用 dependency engine、通知服务或 runtime gate。
- 不修改 Multica/Codex底层、provider、model或认证。
- 不恢复 ZHI-102、ZHI-184。
- 不把线上 instructions 写成大段文字，也不把 Stage Skill内容复制进 Prompt形成第二份流程合同。
