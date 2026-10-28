---
name: wh-review
description: 文档审查保留真实发现与失败；代码调用读取 Long-review 等待方法，OCR 不可用如实记录，同源补充轴独立执行。
---

# wh-review

## 分工与真实消费者

wh-review 执行 make-decision 方向/细节、build-plan 合并及 build-prd 文档审查。复杂任务 build-code 每 Phase 一次独立代码审查，按 `docs/standard-workflow.md`「三审查点与结论真实性」的 U-020 授权与 `runtime/review/review-policy.mjs` 的 `reviewTierFor` 选择执行者；低风险独立子代理，高风险或影响说不清外部 OCR，build-code 终末整卡固定外部 OCR 全审。小改动与普通任务审查方式不变；每次代码调用读取本文件 Long-review 等待方法，不因此改用 wh-review 执行。OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。具体 Phase/终末审查范围与补充派发读取当前 `workflows/build-code/SKILL.md` 或 `workflows/build-code/SKILL.md#最后-phase终末承接`。

镜头沿现 `stage-skill-plan.json`：build-plan 合并审查的三个 lens 为 review、simplicity-guard、plan-eng-review，UI 条件另取 plan-design-review；build-code 取其自身登记的 simplicity-guard/review，终末取 review，不把计划三镜头搬成新的代码审查点。每 Phase 同源 Standards/Spec 两面必派互不继承上下文的独立执行者；只消费 `workflows/build-code/SKILL.md`「同源补充轴」与「Phase 三角色与七步顺序」的唯一派发规则，不能用一人两栏或实施者自审替代。review_host 只做 OCR 长等待宿主；真实失败与覆盖仍按本文件原合同保存。任务用户明确的轮次限制只约束该任务，已返回意见后修复与定向复验不新派正常审查；不因修后未重审宣称通过。

stage-skill-plan.json 仍在本技能原路径提供 required_skills/optional_skills：文档组包读者和 OCR 合同/lens 适配读者复用这些声明。它是选材，不是另一个调度器或审查点；不会把它搬入 runtime/review。历史 build-spec 登记退出当前调用，旧集成审查不恢复为正常节点。

## Input

`stage`为审查阶段、`materials`为允许的完整材料；make-decision以 `review_track`分方向/细节，非阶段审查以现 `review_kind`分面。材料名依当前合同，如 `raw_requirement`、`approved_direction`、`draft_spec_or_acceptance`。`host_provider`不读、不参与选择，旧值不排除/阻断来源，不增必填。

普通首轮request不传 `task_path`、`project_name`、`task_id`、Workspace、Git、snapshot、revision、provider allowlist、result-storage；任务认证仅由「现有接口」的公开CLI参数提供，不入provider材料，旧额外task/workspace字段不作门。

## 输入与方法

1. 接收本次实际 stage/track、允许范围与完整材料。方向盲审只看原始要求、客观事实、约束和非目标；细节审查读当前方向与细节；PRD 读实际任务地图/正文；代码面读声明的真实 diff、合同、lens 和相关验收原件。缺必要材料如实报 MATERIAL_INCOMPLETE，不补猜或擅读范围外文件。
2. 按现有配置选择实际 provider/route，使用现有请求 owner 与阶段审查重点；先备齐可读材料，再调用。材料按下方「现有接口」区分公开入口的顶层 ref 解析与裸入口的完整字节内联，确认所有本次允许材料实际进入 packet。包封装/hash 是传输事实，不是人类确认或继续工作的许可证。
3. provider 只读本次提交材料，不访问真实仓库、父目录、Git、网络或宿主秘密，不派子代理或写文件。工具限制及已证明的 packet 内只读查看例外按本次全文提供的 `contracts/provider-protocol.md` 执行，不把宿主双轴分派搬进 provider。Temporary bundle 使用现有安全路径/清理，失败保持原错误，不能静默丢材料。
4. 主会话保留一份真实 review 原件及执行回执，处置 fixed、rejected_invalid、accepted_risk 或 needs_human。finding 要有能回读的问题/根因/建议/证据；无效锚点标记留原件，内容仍由独立事实判断，不能自动删真实问题。build-code 内严重问题自动优先修复，无法解决保留 incomplete 并继续可执行部分，最终 close 前展示实际损失和风险，不新增中间确认；其它阶段按其真实选择合同处理。仅已有绑定该 finding 的真实用户风险决定才可记 accepted_risk，持续实施授权不能代填风险接受。
5. 已返回语义建议的同scope，不因修复或追空findings重派；无语义结果且具体传输/材料条件已变才按原范围安全重试。恢复/长等待沿同请求，取消沿现信号，不建异步对象/二层生命周期。仅人显式补派原记录未completed来源：非空 `only_providers`、`dispatch_reason`、带sha256的 `supplements`原记录，绑定同材料/subject；不重发成功来源、不追空，不自动补派或按失败率降权（ADR-029/031）。

派发卫生：读取本次可信配置的 initial 实际路线，逐路派发并保留真实 adapter/source/model；未报 model 或模型族记 unknown。同一家族换 provider 键仍是同源，不用键名冒异源。只读探针的不可用、配额或包能力事实单列；不固定收到数量，不以异源下限取消来源，不由 workflow 输入改配置。

材料位按 `runtime/review/stage-materials.json` 当前 stage/track 合同读取；direction 的 `raw_requirement` 是用户原始要求及来源，`objective_facts` 是可核对现状/限制及原件，`convergence_outline` 只列问题、约束、失败后果和较小可逆选项，不提前放当前选择或理由。三个键齐全或 hash 可验不证明三个角色齐；同字节填三位须报告角色未成立，不能只改标签或补 manifest。缺必要位报 MATERIAL_INCOMPLETE，派发前停该请求。detail 使用真实 `raw_requirement` 与 `approved_direction`，其余位沿当前合同，不新增必填键。

调用方用现 `buildReviewMaterials` 核manifest、每份正文/来源及盲/揭示可见性；路径或嵌套ref不证正文送达。direction内部reconstruct→reveal→challenge按本次provider协议，只有盲包仅证重建。派发ARTIFACT + CONTRACT，排除实施者CLAIM/胜利摘要/自拟结论；处置回原件，可用Contract misread / Valid + actionable / Valid trade-off / Noise解释，不新增裁决枚举、轮次或provider替换。

## 输出和失败边界

Phase 三角色按 [build-code「Phase 三角色与七步顺序」](../../workflows/build-code/SKILL.md#phase-三角色与七步顺序)：仅在开发完成并明确回报后启动审查，审查只读，不改代码、测试或材料。普通 finding 直接回原开发；迟到 finding 重开同一 Phase，回同一开发修，审查与测试只复验受影响面。审查明确回报 finding 与未解决项；测试另报命令、退出码、失败归因及覆盖限制；两方回报在开发最后确认前汇合，修复后受影响方重新明确回报，缺回报不提交。本规则不改下方真实失败/不可用口径与 P1 审查执行者选择。

复杂任务的每 Phase 审查在普通记录正文写执行者、来源、三维读数，并用 `assertReviewTierRecord` 核对。独立子代理写派发身份与上下文隔离，来源保持独立子代理，不写 `ocr` 身份或伪造 `provider_results`；外部 OCR 写 route、provider 原ref与真实终态。低风险判据及取数只以标准工作方法上述小节为权威；同输入同结论，证据不可核即外部 OCR，终末整卡全审保持。此正文记录不扩审查 schema 或任务事实 writer。

available 只表示实际收到可读建议，至少一个有效语义 sibling 可以与其它失败并存；partial/available-with-failures 不等于通过。空 findings 只表示本次完成阅读后未提出问题；未执行、不可用、取消、无效 JSON 或缺材料都不是空 findings，也不是用户同意或交付完成。

单路失败或取消后，已有 `completed && parse_outcome=ok` 的意见仍可供下游消费；汇总必须标 `available-with-failures` / partial，不冒充完整结论。取消由 managed client 返回后停止本地轮询，以最后已观察的 settled 路和取消事实结束；零路语义结果仍 `unavailable`。顶层 `provider_results` 每 provider 一条、优先有效语义结果；红蓝 `role_results` 保留原路结果与失败。此处不新增请求级 timeout；真实 broker 无响应且 provider 默认无 timeout 的退出分支仍可能 unavailable。

broker 与 OCR 使用同一覆盖门槛：可靠 evidence anchor 经现有校验映射到材料键才进 `read`；明确派发前受阻进 `unread`；送达但无可靠读取证据仍进 `undetermined`，不能从发送或空 findings 推断已读。

结论须从本次原件同时读出三条件：至少一路真实 `completed && parse_outcome === "ok"`；该路发现或空 findings 有可回读的原始件引用；记录保留未确认项 `material_coverage.undetermined` 与真实 `discarded_facts`（若有，无真实丢弃事实不制造占位）。三条件缺一，报告无结论及具体原因；实际执行者、真实终态和来源均沿原件读取，不由实施者自述或 `review_origin` 的取值推定。

OCR 不可用时四件齐：检测输出与原始失败各沿其唯一原件引用；实际执行者沿本次执行身份原件；覆盖限制沿本次审查记录逐材料说明。四件各给具名保留位置，未取得的写明缺口。检测、失败或同源补充均不能成为非 OCR 结果的 OCR 身份。

`material_coverage` 三键语义固定：`read` 仅含有可靠读取证据的材料；`unread` 是明确未送达或未打开；`undetermined` 是 provider 未报覆盖或读取不可证。不可证一律进 `undetermined`，不进 `read`。现有 `providerCoverage` 对非 `completed` 或非 `ok` 的来源清空 `read` 并保留到 `undetermined`。`read_confirmed` 未证保持 `null`／不适用；当前 OCR adapter 将该布尔或 null 事实放在 provider 结果的 `coverage.read_confirmed`，`material_coverage` 没有这个键，不能新增键或把送出当读懂。覆盖不证明 user case 执行、完整阅读或功能验收。

**冻结字段清单（禁止自造）**：八类为 `review_origin`、`review_result_ref`、provider 结果的 `status`、`parse_outcome`、`review_facts.providers[].opinion_returned`、既有 `material_coverage`（覆盖三键 `read`／`unread`／`undetermined`）、`discarded_facts`、`executor`。三键属于同一类既有覆盖事实，不另算顶层字段。记录字段只填已发生事实的读取结果，不能填对判据的期望；每项都要回到其原件。

- `review_origin`：`runtime/task/task-store.mjs` 的 `writeStageRow`／`currentRow` 按 `REVIEW_ORIGINS` 产出，存 `facts.jsonl` stage行，由 `readTaskFacts`／阶段审查读者消费。`conducted` 须具名 `review_result_ref`，仅证已执行、有原件；实际执行者与OCR不可用事实并列，不据值推结论。
- `review_result_ref`：同上producer/carrier/reader；按 `task-store.mjs:currentRow`，`conducted` 须具名可回读原件（真实执行者/终态）；其它值须null及具体reason，不能仅写unknown。
- provider结果的 `status`：runner给真实终态，`runtime/review/review-record-route.mjs:providerFact` 存原件 `provider_results[]`；`providerCoverage`／`providerFacts`消费。依据 `runtime/review/schemas/result.schema.json:provider_results.items.properties.status`：`running`／`completed`／`failed`／`cancelled`，阶段重要性不能改终态。
- provider结果的 `parse_outcome`：同一runner／`providerFact` 存 `provider_results[]`，`providerCoverage`／`providerFacts`读直接字段或 `execution.parse_outcome`。依据 `result.schema.json`：`ok`／`invalid`／`empty_output`／null；失败/空输出/未取得解析分别保留。
- `review_facts.providers[].opinion_returned`：`review-record-route.mjs:providerFacts`推导，存原件 `review_facts.providers[]`，审查读者核本路意见。`result.schema.json:$defs.reviewFacts`必填布尔，仅真实 `completed` 且解析 `ok` 为true，不证完整覆盖/质量通过。
- `material_coverage`：`review-record-route.mjs:providerCoverage`存原件覆盖数组，审查读者逐材料核。`result.schema.json:$defs.materialCoverage`仅允许 `provider`／`read`／`unread`／`undetermined`，`additionalProperties:false`；三键语义见本节。`read_confirmed`由 `runtime/review/ocr-delegation-adapter.mjs`存provider的 `coverage.read_confirmed`，不在此对象加键。
- `discarded_facts`：真实解析丢弃及 `review-record-route.mjs:onProviderOutput`／`providerFact`产生，存原件现数组，审查读者读理由/来源。`result.schema.json:$defs.discardedFact`必填 `fact_kind`／`reason`并保所需 `dropped_key` 或 `finding_excerpt`；零字节按真实 `provider_output_not_persisted`／`zero_bytes`保留，无事实不造占位。
- `executor`：`tools/cli/stage-runtime.mjs`代码审查OCR返回实际声明，`review-record-route.mjs`存原件；审查读者及 `tests/contract/ocr-delegation-route.test.mjs`、`tests/contract/verify-code-dsh-public-run.test.mjs`身份断言消费。依据 `result.schema.json`枚举 `ocr`／`wh-review`，缺身份留缺口，不造值。不得以OCR身份记wh-review结果；schema版本不是执行者声明，身份/版本/声明不得互代。

对 `OUTPUT_INVALID` 且保留了原始输出的失败来源，操作者必须只读回读该原始输出一次，并记录「其中是否存在唯一可解析的 findings JSON」这一事实；只允许据此救回真实发现，禁止把失败改写成通过或空 findings。

保留 provider 原身份与失败类别：ROUTE_UNAVAILABLE/REVIEW_BROKER_START_FAILED 只用于路线/启动失败；timeout、cancelled、invalid output、material missing、RATE_LIMITED 等保留真实类别。必要脱敏、realpath范围、输入/输出体量与解析限制、配置原子写、并集聚合和信号/资源清理义务仍由现有生产 owner 承接；方法改文不证明这些行为已实测。

原始私有 provider 文本仅留在原有安全诊断位置，公开报告用原始记录引用、脱敏信息和真实错误，不外泄 cookie/token/password/Authorization/API key 或宿主私有路径。材料、独立质量、用户选择、Git/发布分别记录，不由 review 输出授予继续工作权限。

## Long-review host convention

- 由专用审查子代理在一个连续 activation 承接一个同步请求，守到整轮 settled：全部真实 provider 终态且正常已启动请求的正式记录可读，才 final 交付。单来源完成不算整轮完成；失败/取消也算终态。
- 宿主返回 running 时沿同一 job 使用宿主既有长等待，保持 owner 活动；不 final、重启请求或短轮询，不留待下次 activation 收尾。跨 activation 所有权持久性未经验证时保持同步 owner；不新增 tracker、状态、timeout、API 或进度对象。
- 启动失败或未知 job 使正式记录无法取得时，按真实失败/unavailable 交付；显式取消沿既有信号回收并保留 settled 来源事实，未知保持未知。补派仍仅按第5条。

| 实际结果 | 报告口径 |
| --- | --- |
| timeout | unavailable，保留原失败类别 |
| partial | `available-with-failures`，有效来源与失败分别保留 |
| `PUBLIC_RESULT_INVALID` 或宿主调用链失败 | unavailable，保留具体错误 |
| 零字节或无效 JSON | 内部标记 `contract_failure`，不得当空 findings |

终末逐路回读并按「输出和失败边界」报告；等待不授质量通过或操作权限。

## 现有接口

任务内保存正式审查走七类 public runtime 中的 `node tools/cli/stage-runtime.mjs review --action=record`，带当前真实 `--stage`、`--project`、`--task`、`--task-path` 和 `--input`；input 使用普通请求原件的实际路径。命令在该任务的认证 worktree 执行，非认证 cwd 拒绝并报 `CURRENT_WORKTREE_MISMATCH`，外层错误 code 可能为 `WRITE_IDENTITY_PREFLIGHT_FAILED`。`review-record` 是私有映射名，不作为公开命令调用。

公开入口的 input JSON 外壳是 `{request:{stage,review_track,surface,materials}}`；`review_track` 仅在当前阶段需要区分审查轨道时提供，`surface` 为实际 document 或 code 面。request 的 stage 与 CLI 一致，materials 按当前阶段合同给完整内容，不能把外壳示意当成备齐材料；caller 不导入自写 result。

`recordTaskReview`的 `resolveMaterialRefs`仅解析materials顶层恰含 `ref`／`sha256` 的对象。ref为真实相对路径，sha256为原字节64位小写hex；`quality/tests/`、`quality/evidence/`从认证task根读，其余从认证worktree根读并验hash。拒绝绝对路径、空段、`.`/`..`、反斜杠、alias、非普通文件，不静默替字节。可信只读scope下ref须在已批准精确范围，声明/存在不授权根或范围；普通单仓不增callback前置。

嵌套 ref 不递归读取，不能把 context_map/evidence_map 内的 ref 存根当作已投递正文。post build-plan 的独立 Phase 组包须将 `phase_authorities` 内联为 plain object，每个实际相对 Phase path 对应完整正文 string，并按 `phase_index` 执行索引匹配；顶层 JSON ref 只返回文件 string，不会自动变成这个 map。phase_index 可沿公开顶层 ref 读入完整文本。

裸 `wh-review-cli.mjs run` 不解析 ref：它接收审查请求本身，没有公开入口的 request 外壳，材料必须先内联完整字节；ref 对象只会被 packet 序列化，不能冒文件已读。该旧 CLI 仍保留 run、verify-final、doctor 三个真实接口，按实际脚本参数调用；它们与公开七类 runtime 的职责分别保留，不新增 flag/public command 或 legacy bridge。

正式审查原件由现有 `runtime/review/review-record-route.mjs` 单一 producer 保存；只读查询、parser/error、非阶段路由及 contracts、runner/provider/source/helper/schema 仍归现有实现 owner，不由本方法另建流程或 writer。方法正文与接线登记分别由其 owner 维护，不以改文承诺 runtime/canonical/bundle 消费者运行等价。

## 写作与来源

来源权威：[catalog](../catalog.yaml#skills.wh-review)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。来源：本仓review-record-route与provider协议。
创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。

## 同仓方法依赖

`skills/intake-decision-review/SKILL.md`、`skills/plan-ceo-review/SKILL.md`、`skills/plan-design-review/SKILL.md`、`skills/plan-eng-review/SKILL.md`、`skills/review/SKILL.md`、`skills/simplicity-guard/SKILL.md`、`skills/spec-specify/SKILL.md`；按上文及stage-skill-plan的实际条件读取（plan-design-review仅UI分支），搬运时需同时提供或由调用者提供可读原件。
