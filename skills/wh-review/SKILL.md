---
name: wh-review
description: 文档审查保留真实发现与失败；代码调用读取 Long-review 等待方法，回退执行按当前 workflow 的条件分工。
version: 4.1.0
---

# wh-review

## 分工与真实消费者

wh-review 执行 make-decision 方向/细节、build-plan 合并及 build-prd 文档审查。代码审查正常由 OCR 执行：build-code 每 Phase 一次、verify-code 终末一次；每次代码调用读取本文件 Long-review 等待方法，不因此改用 wh-review 执行。需要判断回退时，读取当前 `workflows/build-code/SKILL.md` 或 `workflows/verify-code/SKILL.md` 的「OCR 能力与回退」，按该 workflow 当下的条件与目标执行同一代码面，记录检测、原因、实际执行者和限制。已安装 OCR 的失败、超时、取消或输出无效保留原失败/unavailable，不转成回退通过。

stage-skill-plan.json 仍在本技能原路径提供 required_skills/optional_skills：文档组包读者和 OCR 合同/lens 适配读者复用这些声明。它是选材，不是另一个调度器或审查点；不会把它搬入 runtime/review。历史 build-spec 登记退出当前调用，旧集成审查不恢复为正常节点。

## Input

本节解释现有输入，不新增必填字段：`stage` 指本次审查阶段，`materials` 是本次允许审查的完整材料；make-decision 用 `review_track` 区分方向与细节，mini-task 用现有 `review_kind` 区分审查面。材料名按当前阶段合同选取，例如 `raw_requirement`、`approved_direction`、`draft_spec_or_acceptance`。`host_provider` 已不参与读取或 reviewer 选择，旧调用者传入也不能用它排除或阻断来源。

普通首轮审查不传 `task_path`、`project_name`、`task_id`、Workspace、Git、snapshot、revision、provider allowlist 或 result-storage 字段；旧调用者的额外 task/workspace 字段不成为审查门。现有方法第5条的未完成来源补派仍按其声明使用 `only_providers`、`dispatch_reason` 和原记录引用；本节不新增路由或补派接口。

## 输入与方法

1. 接收本次实际 stage/track、允许范围与完整材料。方向盲审只看原始要求、客观事实、约束和非目标；细节审查读当前方向与细节；PRD 读实际任务地图/正文；代码面读声明的真实 diff、合同、lens 和相关验收原件。缺必要材料如实报 MATERIAL_INCOMPLETE，不补猜或擅读范围外文件。
2. 按现有配置选择实际 provider/route，使用现有请求 owner 与阶段审查重点；先备齐可读材料，再调用。包封装/hash 是传输事实，不是人类确认或继续工作的许可证。材料已落盘为任务或工作树文件时写 `{ "ref": "<路径>", "sha256": "<hex>" }`，不再内嵌；读回校验 sha256。
3. 一次请求返回原始 provider 身份、传输状态、真实 findings、错误及覆盖限制。provider 只读本次提交材料，不访问真实仓库、父目录、Git、网络或宿主秘密，不派子代理或写文件。工具限制及已证明的 packet 内只读查看例外按本次全文提供的 `contracts/provider-protocol.md` 执行，不把宿主双轴分派搬进 provider。Temporary bundle 使用现有安全路径/清理，失败保持原错误，不能静默丢材料。
4. 主会话保留一份真实 review 原件及执行回执，处置 fixed、rejected_invalid、accepted_risk 或 needs_human。finding 要有能回读的问题/根因/建议/证据；无效锚点标记留原件，内容仍由独立事实判断，不能自动删真实问题。build-code、verify-code 内严重问题自动优先修复，无法解决保留 incomplete 并继续可执行部分，最终 close 前展示实际损失和风险，不新增中间确认；其它阶段按其真实选择合同处理。仅已有绑定该 finding 的真实用户风险决定才可记 accepted_risk，持续实施授权不能代填风险接受。
5. 请求只要已经返回语义建议，就不因修复或想追空 findings 重派同 scope 轮次。无语义结果且具体传输/材料问题已改变时，按原调用范围处理安全重试。恢复/长等待沿同一个实际请求，取消按现信号路径执行；本技能不新建异步对象或第二层生命周期。 明确补派仅用于原记录未 completed 的来源：提交非空 `only_providers`、`dispatch_reason` 和带 sha256 的 `supplements` 原记录引用；绑定相同材料与 subject，不重发已成功来源，不因空 findings 追派。补派只由人显式发起，不自动补派；按失败率自动降权同样不做（ADR-029、ADR-031）。

## 输出和失败边界

available 只表示实际收到可读建议，至少一个有效语义 sibling 可以与其它失败并存；partial/available-with-failures 不等于通过。空 findings 只表示本次完成阅读后未提出问题；未执行、不可用、取消、无效 JSON 或缺材料都不是空 findings，也不是用户同意或交付完成。

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

当前 CLI 保留 run、verify-final、doctor 的真实既有接口，按实际脚本参数调用；不要为方法改写发明新 flag/public command。正式审查原件由现有 `runtime/review/review-record-route.mjs` 单一 producer 保存；只读查询、parser/error、mini_task 路由及 contracts、runner/provider/source/helper/schema 仍归现有实现 owner，不由本方法另建流程或 writer。方法正文与接线登记分别由其 owner 维护，不以改文承诺 runtime/canonical/bundle 消费者运行等价。

## 写作与来源

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。
