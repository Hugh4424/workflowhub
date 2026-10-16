---
name: wh-review
description: 文档审查保留真实发现与失败；代码调用读取 Long-review 等待方法，OCR 不可用如实记录，同源补充轴独立执行。
---

# wh-review

## 分工与真实消费者

wh-review 执行 make-decision 方向/细节、build-plan 合并及 build-prd 文档审查。代码审查正常由 OCR 执行：build-code 每 Phase 一次、verify-code 终末一次；每次代码调用读取本文件 Long-review 等待方法，不因此改用 wh-review 执行。OCR 不可用（命令不存在（ENOENT）或版本低于1.12.9）如实记 unavailable/unknown，不换执行者，保留检测输出与原始失败；版本检测其它错误不推断未安装。architect-code-review 是同源补充轴，独立执行，与 OCR 可用性无关；已装 OCR 失败、超时、取消、无效输出、零成功路或空 findings 均保留原始事实。具体 Phase/终末审查范围与补充派发读取当前 `workflows/build-code/SKILL.md` 或 `workflows/verify-code/SKILL.md`。

stage-skill-plan.json 仍在本技能原路径提供 required_skills/optional_skills：文档组包读者和 OCR 合同/lens 适配读者复用这些声明。它是选材，不是另一个调度器或审查点；不会把它搬入 runtime/review。历史 build-spec 登记退出当前调用，旧集成审查不恢复为正常节点。

## Input

本节解释现有输入，不新增必填字段：`stage` 指本次审查阶段，`materials` 是本次允许审查的完整材料；make-decision 用 `review_track` 区分方向与细节，mini-task 用现有 `review_kind` 区分审查面。材料名按当前阶段合同选取，例如 `raw_requirement`、`approved_direction`、`draft_spec_or_acceptance`。`host_provider` 已不参与读取或 reviewer 选择，旧调用者传入也不能用它排除或阻断来源。

普通首轮审查的 request 对象不传 `task_path`、`project_name`、`task_id`、Workspace、Git、snapshot、revision、provider allowlist 或 result-storage 字段；公开 runtime 的任务认证 CLI 参数沿下方「现有接口」提供，不混入 provider 材料。旧调用者的额外 task/workspace 字段不成为审查门。现有方法第5条的未完成来源补派仍按其声明使用 `only_providers`、`dispatch_reason` 和原记录引用；本节不新增路由或补派接口。

## 输入与方法

1. 接收本次实际 stage/track、允许范围与完整材料。方向盲审只看原始要求、客观事实、约束和非目标；细节审查读当前方向与细节；PRD 读实际任务地图/正文；代码面读声明的真实 diff、合同、lens 和相关验收原件。缺必要材料如实报 MATERIAL_INCOMPLETE，不补猜或擅读范围外文件。
2. 按现有配置选择实际 provider/route，使用现有请求 owner 与阶段审查重点；先备齐可读材料，再调用。材料按下方「现有接口」区分公开入口的顶层 ref 解析与裸入口的完整字节内联，确认所有本次允许材料实际进入 packet。包封装/hash 是传输事实，不是人类确认或继续工作的许可证。
3. 一次请求返回原始 provider 身份、传输状态、真实 findings、错误及覆盖限制。provider 只读本次提交材料，不访问真实仓库、父目录、Git、网络或宿主秘密，不派子代理或写文件。工具限制及已证明的 packet 内只读查看例外按本次全文提供的 `contracts/provider-protocol.md` 执行，不把宿主双轴分派搬进 provider。Temporary bundle 使用现有安全路径/清理，失败保持原错误，不能静默丢材料。
4. 主会话保留一份真实 review 原件及执行回执，处置 fixed、rejected_invalid、accepted_risk 或 needs_human。finding 要有能回读的问题/根因/建议/证据；无效锚点标记留原件，内容仍由独立事实判断，不能自动删真实问题。build-code、verify-code 内严重问题自动优先修复，无法解决保留 incomplete 并继续可执行部分，最终 close 前展示实际损失和风险，不新增中间确认；其它阶段按其真实选择合同处理。仅已有绑定该 finding 的真实用户风险决定才可记 accepted_risk，持续实施授权不能代填风险接受。
5. 请求只要已经返回语义建议，就不因修复或想追空 findings 重派同 scope 轮次。无语义结果且具体传输/材料问题已改变时，按原调用范围处理安全重试。恢复/长等待沿同一个实际请求，取消按现信号路径执行；本技能不新建异步对象或第二层生命周期。 明确补派仅用于原记录未 completed 的来源：提交非空 `only_providers`、`dispatch_reason` 和带 sha256 的 `supplements` 原记录引用；绑定相同材料与 subject，不重发已成功来源，不因空 findings 追派。补派只由人显式发起，不自动补派；按失败率自动降权同样不做（ADR-029、ADR-031）。

派发卫生：派发前用已有的 broker 探针筛掉确定性不可用的路线；在满足「至少一条异源建议」的前提下把路线数收到 3 条；账号配额窗口内不使用对应的 provider；大包全文审查不使用会打转的路线。探针只读，筛除与配额事实照实记录；本条不新增公共命令、调度状态或重试状态。

## 输出和失败边界

available 只表示实际收到可读建议，至少一个有效语义 sibling 可以与其它失败并存；partial/available-with-failures 不等于通过。空 findings 只表示本次完成阅读后未提出问题；未执行、不可用、取消、无效 JSON 或缺材料都不是空 findings，也不是用户同意或交付完成。

真的出了结论，须从本次审查原件同时读出三条件：至少一路真实 `completed && parse_outcome === "ok"`；该路发现或空 findings 有可回读的原始件引用；记录保留未确认项 `material_coverage.undetermined` 与真实 `discarded_facts`（若有，无真实丢弃事实不制造占位）。三条件缺一，报告无结论及具体原因；三条件齐只说明本次返回了可核对的意见，不表示质量通过或功能验收。实际执行者、真实终态和来源均沿原件读取，不由实施者自述或 `review_origin` 的取值推定。

OCR 不可用时四件齐：检测输出与原始失败各沿其唯一原件引用；实际执行者沿本次执行身份原件；覆盖限制沿本次审查记录逐材料说明。四件各给具名保留位置，未取得的写明缺口。检测、失败或同源补充均不能成为非 OCR 结果的 OCR 身份。

`material_coverage` 的覆盖三键语义固定：`read` 仅含有可靠读取证据的材料；`unread` 是明确未送达或未打开；`undetermined` 是 provider 未报覆盖或读取不可证。不可证一律进 `undetermined`，不进 `read`。现有 `providerCoverage` 对非 `completed` 或非 `ok` 的来源清空 `read` 并保留到 `undetermined`。`read_confirmed` 未证保持 `null`／不适用；当前 OCR adapter 将该布尔或 null 事实放在 provider 结果的 `coverage.read_confirmed`，`material_coverage` 没有这个键，不能新增键或把送出当读懂。覆盖不证明 user case 执行、完整阅读或功能验收。

**冻结字段清单（禁止自造）**：八类为 `review_origin`、`review_result_ref`、provider 结果的 `status`、`parse_outcome`、`review_facts.providers[].opinion_returned`、既有 `material_coverage`（覆盖三键 `read`／`unread`／`undetermined`）、`discarded_facts`、`executor`。三键属于同一类既有覆盖事实，不另算顶层字段。记录字段只填已发生事实的读取结果，不能填对判据的期望；每项都要回到其原件。

- `review_origin`：producer 是 `runtime/task/task-store.mjs` 的 `writeStageRow`／`currentRow`，carrier 是 `facts.jsonl` 的现有 stage 行，reader 是 `readTaskFacts` 与阶段审查读者。依据同文件 `REVIEW_ORIGINS` 枚举；`conducted` 必须有具名 `review_result_ref`，只表示确实执行过且有原件，实际执行者与 OCR 不可用事实如实并列，不由该取值推定有结论。
- `review_result_ref`：同一 stage producer、carrier 与 reader。依据 `task-store.mjs` 的 `currentRow` 校验：`conducted` 需具名原件；非 `conducted` 必须空值加具体 reason。引用要能读回真实执行者、终态和原件，原因不能只写 unknown。
- provider 结果的 `status`：runner 返回真实终态，`runtime/review/review-record-route.mjs` 的 `providerFact` 保留到 review 原件的 `provider_results[]`，`providerCoverage` 与 `providerFacts` 消费它。依据 `runtime/review/schemas/result.schema.json` 的 `provider_results.items.properties.status` 枚举 `running`／`completed`／`failed`／`cancelled`；不能因阶段重要而改终态。
- provider 结果的 `parse_outcome`：同一 runner／`providerFact` 保存到 `provider_results[]`，`providerCoverage` 与 `providerFacts` 读取现有直接字段或 `execution.parse_outcome`。依据 `result.schema.json` 的真实解析枚举 `ok`／`invalid`／`empty_output`／null；失败、空输出和未取得解析事实分别保留。
- `review_facts.providers[].opinion_returned`：`review-record-route.mjs` 的 `providerFacts` producer 推导，carrier 是 review 原件的 `review_facts.providers[]`，审查读者据此核本路是否返回意见。依据 `result.schema.json` 的 `$defs.reviewFacts` 必填布尔；仅真实 `completed` 且解析 `ok` 为 true，不代表覆盖完整或质量通过。
- `material_coverage`：`review-record-route.mjs` 的 `providerCoverage` producer 保存到既有 review 原件覆盖数组，审查读者逐材料核对。依据 `result.schema.json` 的 `$defs.materialCoverage`：对象仅允许 `provider` 加 `read`／`unread`／`undetermined` 四键，`additionalProperties:false`。三键语义见上文；`read_confirmed` 的现有 producer 是 `runtime/review/ocr-delegation-adapter.mjs`，carrier 是 provider 的 `coverage.read_confirmed`，不是这里的新键。
- `discarded_facts`：真实解析丢弃事实与 `review-record-route.mjs` 的 `onProviderOutput`／`providerFact` 等输出处理产生，carrier 是 review 原件的现有数组，审查读者消费理由与来源。依据 `result.schema.json` 的 `$defs.discardedFact` 必填 `fact_kind`／`reason`，并保所需 `dropped_key` 或 `finding_excerpt`；零字节沿真实 `provider_output_not_persisted`／`zero_bytes` 事实保留。有真实事实才保留，无事实不制造占位。
- `executor`：`tools/cli/stage-runtime.mjs` 的代码审查 OCR 返回路径产生实际执行者声明，`review-record-route.mjs` 将现有返回结果身份保存到 review 原件；`tests/contract/ocr-delegation-route.test.mjs` 与 `tests/contract/verify-code-dsh-public-run.test.mjs` 的身份断言及审查读者消费它。依据 `result.schema.json` 的既有枚举 `ocr`／`wh-review`；没有执行身份事实时保留缺口，不补造值。不得以 OCR 身份记 wh-review 结果；schema 版本不是执行者声明，记录身份、schema 版本与执行者声明不得互相顶替。

对 `OUTPUT_INVALID` 且保留了原始输出的失败来源，操作者必须只读回读该原始输出一次，并记录「其中是否存在唯一可解析的 findings JSON」这一事实；只允许据此救回真实发现，禁止把失败改写成通过或空 findings。

保留 provider 原身份与失败类别：ROUTE_UNAVAILABLE/REVIEW_BROKER_START_FAILED 只用于路线/启动失败；timeout、cancelled、invalid output、material missing、RATE_LIMITED 等保留真实类别。必要脱敏、realpath范围、输入/输出体量与解析限制、配置原子写、并集聚合和信号/资源清理义务仍由现有生产 owner 承接；方法改文不证明这些行为已实测。

原始私有 provider 文本仅留在原有安全诊断位置，公开报告用原始记录引用、脱敏信息和真实错误，不外泄 cookie/token/password/Authorization/API key 或宿主私有路径。材料、独立质量、用户选择、Git/发布分别记录，不由 review 输出授予继续工作权限。

## Long-review host convention

- 正常代码审查仍由 OCR 执行，本节仅调用等待方法；由专用审查子代理在一个连续 activation 承接一个同步请求，守到整轮 settled：全部真实 provider 终态且正常已启动请求的正式记录可读，才 final 交付。单来源完成不算整轮完成；失败/取消也算终态。
- 宿主返回 running 时沿同一 job 使用宿主既有长等待，保持 owner 活动；不 final、重启请求或短轮询，不留待下次 activation 收尾。跨 activation 所有权持久性未经验证时保持同步 owner；不新增 tracker、状态、timeout、API 或进度对象。
- 启动失败或未知 job 使正式记录无法取得时，按真实失败/unavailable 交付；显式取消沿既有信号回收并保留 settled 来源事实，未知保持未知。既有第5条的人显式补派边界不变；调用完成职责不改审查次数、质量或授权。

| 实际结果 | 报告口径 |
| --- | --- |
| timeout | unavailable，保留原失败类别 |
| partial | `available-with-failures`，有效来源与失败分别保留 |
| `PUBLIC_RESULT_INVALID` 或宿主调用链失败 | unavailable，保留具体错误 |
| 零字节或无效 JSON | 内部标记 `contract_failure`，不得当空 findings |

partial 不表示通过。原始私有 provider 文本保持在既有安全诊断位置，公开边界保留脱敏错误和原记录引用；不由等待成功推导质量通过或操作授权。

## 现有接口

任务内保存正式审查走七类 public runtime 中的 `node tools/cli/stage-runtime.mjs review --action=record`，带当前真实 `--stage`、`--project`、`--task`、`--task-path` 和 `--input`；input 使用普通请求原件的实际路径。命令在该任务的认证 worktree 执行，非认证 cwd 拒绝并报 `CURRENT_WORKTREE_MISMATCH`，外层错误 code 可能为 `WRITE_IDENTITY_PREFLIGHT_FAILED`。`review-record` 是私有映射名，不作为公开命令调用。

公开入口的 input JSON 外壳是 `{request:{stage,review_track,surface,materials}}`；`review_track` 仅在当前阶段需要区分审查轨道时提供，`surface` 为实际 document 或 code 面。request 的 stage 与 CLI 一致，materials 按当前阶段合同给完整内容，不能把外壳示意当成备齐材料；caller 不导入自写 result。

现 `recordTaskReview` 调用 `resolveMaterialRefs`，只解析 materials **顶层**恰有 `ref`、`sha256` 两键的对象。ref 是实际文件相对路径，sha256 是其原字节的 64 位小写 hex；`quality/tests/`、`quality/evidence/` 取认证 task 根，其余取认证 worktree 根。读取校验 hash；绝对路径、空段、`.`/`..`、反斜杠、路径 alias 或非普通文件拒绝，不能静默替换字节。使用现可信只读 scope 时，ref 还须落在已批准精确范围；材料声明或路径存在不授予读取根/范围，普通单仓调用不新增 callback 前置条件。

嵌套 ref 不递归读取，不能把 context_map/evidence_map 内的 ref 存根当作已投递正文。post build-plan 的独立 Phase 组包须将 `phase_authorities` 内联为 plain object，每个实际相对 Phase path 对应完整正文 string，并按 `phase_index` 执行索引匹配；顶层 JSON ref 只返回文件 string，不会自动变成这个 map。phase_index 可沿公开顶层 ref 读入完整文本。

裸 `wh-review-cli.mjs run` 不解析 ref：它接收审查请求本身，没有公开入口的 request 外壳，材料必须先内联完整字节；ref 对象只会被 packet 序列化，不能冒文件已读。该旧 CLI 仍保留 run、verify-final、doctor 三个真实接口，按实际脚本参数调用；它们与公开七类 runtime 的职责分别保留，不新增 flag/public command 或 legacy bridge。

正式审查原件由现有 `runtime/review/review-record-route.mjs` 单一 producer 保存；只读查询、parser/error、mini_task 路由及 contracts、runner/provider/source/helper/schema 仍归现有实现 owner，不由本方法另建流程或 writer。方法正文与接线登记分别由其 owner 维护，不以改文承诺 runtime/canonical/bundle 消费者运行等价。

## 写作与来源

完整来源权威：[catalog条目](../catalog.yaml#skills.wh-review)；正文/小卡是非权威线索，单技能副本缺catalog时向来源维护者取登记。来源：本仓review-record-route与provider协议。
创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。
