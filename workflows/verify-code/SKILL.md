---
name: verify-code
description: 独立核对实际实现、真实消费者、失败边界和验收证据。
version: 5.2.0
---

# Verify Code

## 目标与边界

对当前实现做一次终末代码审查，同时独立复核本次受影响验收结果。读取 decision-log、spec、物理 Phase 和实现，索引只导航。不要重演 Talk/Grill 或替上游重写规格；代码问题留同任务修，材料疑点交作者并保留风险，历史材料与审查只作背景，不启用 pre 工作流。

## 方法

1. 开工首步核真实 worktree、branch、当前 HEAD、允许写集及其来源，把实际核对命令和结果用已有 `runtime/interface/run-command.mjs` 保存为当前 `quality/tests/` 原件；不一致先定位纠正，不猜任务，不把核对变成人类确认或新的 runtime gate，无法完成时如实保留缺口。接续时读取 `skills/stage-handoff/SKILL.md`，按其路径选择与回读方法消费实际交接、当前材料和 task facts，定位有来源的阶段工作陈述、四类信息、证据与具体未完事项；材料疑点仍交原作者 owner。新会话据此核对当前范围并直接续跑，沿用已有任务授权；缺失或错 task 如实披露，旧对象只读，能够定位的同 task 工作按共享方法继续。读真实入口、消费者、diff、完整 AC 和 build-code 的实际执行原件，区分已经执行、未执行、失败、不可用及覆盖限制。原始来源、服务、样本或 Phase 正文缺失保持 unknown/unavailable，不以文件存在、旧 review 或 exit0 代填通过。 在本次常规代码审查中，对交付范围逐项抽查母 PRD/原始需求 → decision-log.md 的已确认裁决 → spec.md 的 FR/AC → 各物理 phases/P<n>.md 的任务与 oracle → 当前实现、测试/质量证据。
2. 发起一次终末独立代码审查，正常使用 OCR，能力与条件回退见下节。审查输入包含 verify-code 合同、provider 协议、stageReviewFocus、lens 正文、当前 diff、完整 AC 与可用执行原件；执行者检查真实消费者、生命周期、权限、数据泄漏、并发、取消、恢复、资源释放和测试强度。
3. 保留每路 provider 的原始 findings、实际执行者、错误、取消与覆盖限制。已安装 OCR 的失败不由其它 route 漂白。外发材料核实际范围、路径安全和敏感信息脱敏，缺真实只读能力时明确不可用。 首个 provider 到终态后立即处理并把迟到 findings 交给同一回调，剩余 provider 继续运行；不能因首个结果取消 sibling。跨 stage 的 build-code Phase 审查结果不得充当 verify-code 的第二次独立审查。
4. 按金钱、隐私权限、不可逆后果、外部副作用、跨 Phase 旅程和失败恢复风险独立选样；逐项列已抽查与未抽查 case/AC 及理由。沿原始业务规则→真实入口→断言→实际效果核语义，代码质量、业务效果、测试充分性分别给证据；模拟结果不当外部效果，缺数据、权限或服务保持未知。 三类证据分别记 `business_effect=observed_pass|observed_fail|unknown|unavailable|N/A(reason)`、`semantic_test_adequacy=adequate|inadequate|unknown`、`code_review=clean|resolved|incomplete|failed`。功能验收记录与终末代码审查回执分开成件：功能验收记录独立成件，不得由代码审查回执替代或冒充。审查回执内的宿主侧 `conclusion` 与 `coverage` 由 provider 状态与 findings 推导，只记代码审查观察和覆盖事实；覆盖只说明是否返回 findings 及 provider 完成/失败数量，不代表 user case 执行或被审对象完整覆盖，不是功能验收结论。功能验收记录及独立人读判断分别成件，功能判断的判定来源件是功能验收记录；各给实际路径，验收记录逐条给 AC 结论与独立证据指针。按当前验收 Phase 正文的具名引用读取实际输出、执行/复验/分诊与独立走查原件，来源核对复用 stage-handoff 的路径回读方法；不以审查字段或 findings 代替业务效果，不新增同名功能机器字段、第二 writer 或质量对象图。
5. 主会话逐条判断 finding，仅修影响当前交付的有效代码问题，不因材料偏好扩大范围。有效问题回原实施会话自动修复，严重问题优先修复，不以请求用户承担风险代替修复。确实无法在当前任务范围内解决时，列影响、证据、owner、原因和剩余选项，继续不受影响的工作，严重未修风险保持 incomplete；只有已有绑定该 finding 的用户真实决定才可记 accepted_risk，不能自行接受风险或伪造通过。
6. 对新修复和真实疑点只做必要定向复验，事先列 file/case 集合，把实际 command/exit/raw 和恢复结果写在对应 finding 处置旁；无改动或疑点时说明无需复跑。不重派第二次正常代码审查，不重做全量上游测试。
7. 保留原始审查与当前 fixed、rejected_invalid、accepted_risk、needs_human 处置。真实修复可报告 resolved，不能改写原 review 或用摘要覆盖失败。核对本次 actual/oracle、未执行事项和覆盖限制；材料问题交 owner，不另建恢复、继任或重绑定任务。
8. 给人读结论并执行 stage-handoff：检查范围、代码修复、原发现和处置、必要验证、业务结果、未知项、上游材料风险及下一步。缺 review/执行原件/严重风险处置时保持 incomplete；继续同任务修复，但不宣称已完成验收或物理交付。 对账时在独立上下文跑一次 `node tests/acceptance/card-09-session-ledger.mjs`，当场展示时间窗、分账与计数，不落派生文件；修 finding 后只复验受影响 file/case 并写明理由。 如果 finding 在同一 task 已修复，resolved 与无 finding 的 clean 具有同等完成含义；这不是“所有材料和证据都齐了”。incomplete 只限制质量声明，不限制同一 task 继续修复。按当前材料与实际未完成事项继续同一 task；work_status 与 quality 状态只记录材料/质量事实，不是继续工作的许可证；不能把 status=in_progress 或 quality_status=incomplete 当作工作冻结，不增加 continuation_allowed 字段或 runtime 机制。

UI 适用时从真实页面和 Component Quality Map 核消费者、状态 owner、typed ViewModel、CSS/token、story/test 更新及已实际产生的浏览器状态；Design.md 与 Experience.md 各自职责不混写。缺扫描、浏览器、fixture、viewport、截图或入口受阻保持 unknown/unavailable，不能把未观察当 N/A 或视觉通过。只有新疑点才重跑相应浏览器检查，先按 isolated-browser-qa 管理隔离、登录态与自建资源清理。

## OCR 能力与回退

先检查 `ocr` 命令和 `ocr --version`。仅命令不存在（ENOENT）或版本低于1.12.9，回退 wh-review 执行同一终末代码审查，保留检测、fallback 原因、原始输入、真实输出和限制。版本检测其它错误不推断未安装；OCR 已装而执行失败、超时或取消时不回退，按真实 unavailable/失败记录。依赖真实 OCR 的测试在未安装时显式 skip 并披露。不能把成功替代伪标成 OCR，也不把不可用写成空 findings。

## 人为门与审查点

用户已授权任务进入实施，或已选择方向与实施计划后，该授权持续覆盖本 task 范围内的验证、独立审查、修复及完成交付必要的 commit、push、merge；阶段切换、新会话和 handoff 不重置授权。本阶段直接执行，不要求日常确认、本地提交授权、技术验收确认或用户承担严重风险；新增方向或任务范围不能据此擅自扩大。能通过真实入口观察的业务效果自动验证；确实依赖真人、缺权限、数据或外部服务的部分，列清所需条件、操作、成功/失败恢复判据和应回传证据，保持 unknown/unavailable/incomplete，继续其它验证，不将其变成中间确认门或推导为业务通过。真实平台权限限制与无法解决的方向问题同样如实报告。

authorize 是已有授权的记录与消费工具，不是提问按钮。每次实际 Git 操作前调用 `runtime/interface/git-authorize.mjs`，以真实授权原话及来源绑定动作、范围、当前分支和 HEAD，执行前 record/consume；HEAD 变化时重新核对并记录，不能消费旧 HEAD 记录。审查结论不能冒充用户授权。进入最终 close 或准备保留任务 worktree/分支时，必须读取 `docs/standard-workflow.md` 的默认安全收口：展示实际结果、质量限制、默认归档/删除范围与具名例外，取得一次最终范围确认后复用其既有窄工具和普通 Git 动作；范围确认不替代质量结论。整树丢弃、强推或任务外改动不包含在本阶段持续授权内，不作为常规交付路径。三必留审查点为 build-plan wh-review 合并、build-code 每 Phase OCR、本阶段终末 OCR；不恢复全 Phase 集成审查。

## 使用技能与安全收口

按 `skill-deps.yaml` 直接读取方法；真实消费者检查、定向验证和独立审查按项目分工委派，主会话负责发现处置、用户选择与总结。技能与工具缺失如实说明，不能增加公共命令或新状态对象。原子写入、共享记录冲突保护与工作区核对分别使用现有窄工具，失败保持可见；历史原件只读。

阶段末主会话使用 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，供用户交接材料现状、当前代码、真实检查、风险和下一步。交接执行不是门，缺失只披露；不要求固定机器复盘或交接认证。正式阶段事实仍由现有公共流程处理。实现、质量、业务验收、发布和物理 close 分别报告，不互相代填。交接列出默认安全收口的实际目标路径、任务分支、待最终确认动作与具名保留原因；确认后逐项回读普通执行结果，保留旧 raw/审查原件，不恢复旧 close plan 或新增公共流程节点。
