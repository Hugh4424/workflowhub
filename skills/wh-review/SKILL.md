---
name: wh-review
description: 执行文档面独立审查，并在 OCR 缺失或版本不足时代为执行同一代码审查面，保留真实发现与失败。
version: 4.1.0
---

# wh-review

## 分工与真实消费者

wh-review 是 make-decision 方向/细节、build-plan 合并审查及 build-prd 文档审查的执行者。代码审查正常由 OCR 执行：build-code 每 Phase 一次、verify-code 终末一次。只有检测到 OCR 未安装（ENOENT）或版本低于1.12.9，才由 wh-review 执行同一代码面并记录回退原因；已安装的执行失败、超时、取消或输出无效保留 unavailable，不转成回退通过。

stage-skill-plan.json 仍在本技能原路径提供 required_skills/optional_skills：文档组包读者和 OCR 合同/lens 适配读者复用这些声明。它是选材，不是另一个调度器或审查点；不会把它搬入 runtime/review。历史 build-spec 登记退出当前调用，旧集成审查不恢复为正常节点。

## 输入与方法

1. 接收本次实际 stage/track、允许范围与完整材料。方向盲审只看原始要求、客观事实、约束和非目标；细节审查读当前方向与细节；PRD 读实际任务地图/正文；代码面读声明的真实 diff、合同、lens 和相关验收原件。缺必要材料如实报 MATERIAL_INCOMPLETE，不补猜或擅读范围外文件。
2. 按现有配置选择实际 provider/route，采用既有 broker 请求和阶段审查重点。先准备可读材料，再调用；当前脚本的内部包封装/hash 在 P5 剥离前仍是中间实现事实，本方法不把它当人类确认或继续工作的许可证。 材料已落盘为任务或工作树文件时写 `{ "ref": "<路径>", "sha256": "<hex>" }`，不再内嵌；读回校验 sha256。
3. 一次请求返回原始 provider 身份、传输状态、真实 findings、错误及覆盖限制。provider 只读本次提交材料，不访问真实仓库、父目录、Git、shell、网络或宿主秘密。Temporary bundle 使用现有安全路径/清理，失败保持原错误，不能静默丢材料。
4. 主会话保留一份真实 review 原件及执行回执，处置 fixed、rejected_invalid、accepted_risk 或 needs_human。finding 要有能回读的问题/根因/建议/证据；无效锚点标记留原件，内容仍由独立事实判断，不能自动删真实问题。build-code、verify-code 内严重问题自动优先修复，无法解决保留 incomplete 并继续可执行部分，最终 close 前展示实际损失和风险，不新增中间确认；其它阶段按其真实选择合同处理。仅已有绑定该 finding 的真实用户风险决定才可记 accepted_risk，持续实施授权不能代填风险接受。
5. 请求只要已经返回语义建议，就不因修复或想追空 findings 重派同 scope 轮次。无语义结果且具体传输/材料问题已改变时，按原调用范围处理安全重试。恢复/长等待沿同一个实际请求，取消按现信号路径执行；本技能不新建异步对象或第二层生命周期。 明确补派仅用于原记录未 completed 的来源：提交非空 `only_providers`、`dispatch_reason` 和带 sha256 的 `supplements` 原记录引用；绑定相同材料与 subject，不重发已成功来源，不因空 findings 追派。

## 输出和失败边界

available 只表示实际收到可读建议，至少一个有效语义 sibling 可以与其它失败并存；partial/available-with-failures 不等于通过。空 findings 只表示本次完成阅读后未提出问题；未执行、不可用、取消、无效 JSON 或缺材料都不是空 findings，也不是用户同意或交付完成。

保留 provider 原身份与失败类别：ROUTE_UNAVAILABLE/REVIEW_BROKER_START_FAILED 只用于路线/启动失败；timeout、cancelled、invalid output、material missing、RATE_LIMITED 等保留真实类别。必要脱敏、realpath范围、输入/输出体量与解析限制、配置原子写、并集聚合和信号/资源清理义务仍在；P5 才改生产链，不能把方法改文当这些行为已实测。

原始私有 provider 文本仅留在原有安全诊断位置，公开报告用原始记录引用、脱敏信息和真实错误，不外泄 cookie/token/password/Authorization/API key 或宿主私有路径。材料、独立质量、用户选择、Git/发布分别记录，不由 review 输出授予继续工作权限。

## 现有接口

当前 CLI 保留 run、verify-final、doctor 的真实既有接口，按实际脚本参数调用；不要为方法改写发明新 flag/public command。verify-final 的必要只读结果查询及 parser/error 行为和 mini_task 旧路由由 P5 唯一 owner 改接。contracts、runner/provider/source/helper/schema 路径保持；这次只改变方法与登记，不承诺旧 runtime/canonical/bundle 消费者运行等价。
