---
name: build-plan
description: 把已确认方向写成产品规格和独立、可执行的 Phase 计划。
version: 4.1.0
---

# Build Plan

## 目标与边界

消费当前 `decision-log.md` 和真实需求来源，编写同一 `spec.md` 的产品规格与全局实现设计、独立 `phases/P<n>.md` 和纯指针 `phases/index.md`。索引不能替代 Phase 正文，post 不双写 plan/tasks；pre 历史材料只读。本阶段不重新进行方向 Talk/Grill，不替用户决定新方向，不实施生产代码。材料有歧义走本阶段 spec-clarify，方向变化回 make-decision；无关的安全规划可以继续。

## 方法

1. 读取当前决策及已有材料，逐项提取需求、成功失败条件、非目标、约束、风险、已接受的不做事项和未决项。保持需求到 FR、AC、Phase/Task、验证方法的双向可追溯；真实来源缺失就写缺口，不用旧审查或绿灯代填。
2. 按实现风险研究现有代码、真实消费者、接口和数据边界、权限、取消恢复、测试与回退方式。只调查会改变设计的问题；不必要或不可执行的研究写原因。
3. 通过 spec-clarify 澄清影响结果的规格歧义。独立问题合问，有依赖的等真实回复；主会话保存问题、真实答复和影响，未答不默认同意。不为规划另开方向 Talk 或第二决策日志。
4. 用 spec-specify 写产品叙事、用户旅程、状态与异常行为、FR 和唯一验收条款。明确每条验收的场景、可观察结果、通过和失败条件；保持 decision-log 的取舍与退役决定，不自动补做已经退出的需求。
5. UI 适用时读取当前 Design.md、Experience.md 和实际页面/组件消费者；需要时使用 ui-project-init、design-source-readiness、frontend-prototype-render 和设计审查方法。展示真实原型或标明预览缺失，不能把静态稿或截图名称当交互验证。非 UI 写原因，来源冲突保持 unknown；UI 选择在现有计划确认中呈现，不新建阶段或确认槽。
6. 选择足够简单的方案：先复用，再窄扩展，确有真实收益才新机制。用 spec-plan 在同一 spec 写全局接口、数据流、兼容、风险、回退和文件边界，再写独立 Phase。每个文件有明确 owner，并行任务有独立输入和写集；共享接口变化先重排分工，不让两个代理同时改同一文件。
7. 为每个任务写清目标、真实输入/消费者、允许路径/符号、禁止范围、步骤、完成条件、失败信号与恢复办法、成本假设。testing-system-blueprint 设计风险、场景、oracle、证据与覆盖限制，test-routing-advisor 选择实际需要的 concrete testing skill。最后用 spec-tasks 生成纯指针索引，执行进度留在任务事实而非材料正文。
8. 行为改动在实施前写有意义的目标测试并实跑 RED：命名目标断言失败才算目标 RED，收集、环境或配置失败另记。冻结评分逻辑，实施使用同一 oracle 做 GREEN；改变 oracle 先提出具体 test change request 并独立审查，旧字节和失败原件保留。纯方法/文档按 G-2 做可证伪读回或说明具体不适用理由，不造仪式性 RED。
9. 对当前规格和 Phase 做一次 wh-review 合并审查。simplicity-guard、plan-eng-review 等 lens 看同一材料，发现由独立上下文产生，不成为额外固定审查轮。保留原始 findings、实际 provider、失败和覆盖限制，不把 unavailable 写成空 findings 或通过。
10. 主会话逐条处置 fixed、rejected_invalid、accepted_risk 或 needs_human。有效设计问题回原作者修；严重问题若不修，向用户展示具体风险、影响和替代路径，取得真实选择并写负责人。未经实际处理不宣布计划已经完整。
11. 最后用 spec-analyze 对照原始需求、决策、spec、每个 Phase 和索引的实际含义，核遗漏、矛盾、孤儿任务、越界、消费者和测试充分性。分析是质量事实，不是推进许可证；缺失与失败继续保持可见。
12. 展示将做什么、Phase 分工、验证办法、发现处置、风险与下一步，取得用户对当前计划的实际确认。拒绝或未答保持草稿，继续同任务的安全修复；确认不能被审查结果或 agent 推测代替。阶段末执行 stage-handoff，写人读交接。

## UI 组件与真实消费者

UI 任务用 frontend-component-quality 的 Component Quality Map 说明复用、改动或新增的真实消费者、状态 owner、typed ViewModel、单一 CSS/token owner、兼容影响及相应 story/test 更新。提取共享组件有至少两个真实消费者，删除有当前零消费证明；缺消费者、扫描、浏览器、数据、viewport 或 screenshot 记 unknown/unavailable，不当作零消费或完成。Design.md 管视觉/组件规范，Experience.md 管页面、交互和测试行为；只在跨越其职责时计划更新。规划设计检查，不替 build-code 执行前端或浏览器验收。

## 使用技能与人为门、审查点

按 `skill-deps.yaml` 直接读取方法；研究、Phase 草稿、RED 与独立审查依项目分工委派，主会话负责范围、用户问题和计划确认。技能缺失只记录其影响和覆盖限制，不另建调度器。

confirm 发生在 make-decision、build-plan 和 build-prd 收口，保留用户对实际展示材料的真实答复；本阶段的计划确认不授权 Git。不可逆动作前才使用 authorize，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD，HEAD 不一致时拒绝消费旧记录；已有用户授权覆盖动作和范围时，按当前 HEAD 重新记录并消费，仅未覆盖的新增动作或范围需用户决定。三审查点是本阶段 wh-review 合并、build-code 每 Phase OCR、verify-code 终末 OCR；make-decision/build-prd 的文档建议仍由 wh-review 按分工执行，不增加全 Phase 集成审查。

## 收口与安全

当前材料决定工作内容，测试、审查和历史不替代材料，也不是继续修复的许可证。写材料前核目标工作区与写集；原子写入失败明确报告，共享写入冲突用记录锁，原始来源与失败保留单份。阶段事实仍由现有公共流程处理，本方法不增加认证包装或永久状态。主会话执行 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，说明材料现状、已做/未做、证据、风险及 build-code 下一步。handoff 缺失只披露，不要求固定机器复盘或逐步发布。
