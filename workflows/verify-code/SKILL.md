---
name: verify-code
description: 独立核对实际实现、真实消费者、失败边界和验收证据。
version: 5.2.0
---

# Verify Code

## 目标与边界

对当前实现做一次终末代码审查，同时独立复核本次受影响验收结果。读取 decision-log、spec、物理 Phase 和实现，索引只导航。不要重演 Talk/Grill 或替上游重写规格；代码问题留同任务修，材料疑点交作者并保留风险，历史材料与审查只作背景，不启用 pre 工作流。

## 方法

1. 接续时读取 `skills/stage-handoff/SKILL.md`，按其路径选择与回读方法消费实际交接、当前材料和 task facts，定位有来源的阶段工作陈述、四类信息、证据与具体未完事项；材料疑点仍交原作者 owner。新会话据此提出下一步建议并等待用户确认；缺失或错 task 如实披露，旧对象只读，已有授权内的同 task 修复按共享方法继续。读真实入口、消费者、diff、完整 AC 和 build-code 的实际执行原件，区分已经执行、未执行、失败、不可用及覆盖限制。原始来源、服务、样本或 Phase 正文缺失保持 unknown/unavailable，不以文件存在、旧 review 或 exit0 代填通过。
2. 发起一次终末独立代码审查，正常使用 OCR，能力与条件回退见下节。审查输入包含 verify-code 合同、provider 协议、stageReviewFocus、lens 正文、当前 diff、完整 AC 与可用执行原件；执行者检查真实消费者、生命周期、权限、数据泄漏、并发、取消、恢复、资源释放和测试强度。
3. 保留每路 provider 的原始 findings、实际执行者、错误、取消与覆盖限制。已安装 OCR 的失败不由其它 route 漂白。外发材料核实际范围、路径安全和敏感信息脱敏，缺真实只读能力时明确不可用。
4. 按金钱、隐私权限、不可逆后果、外部副作用、跨 Phase 旅程和失败恢复风险独立选样；逐项列已抽查与未抽查 case/AC 及理由。沿原始业务规则→真实入口→断言→实际效果核语义，代码质量、业务效果、测试充分性分别给证据；模拟结果不当外部效果，缺数据、权限或服务保持未知。
5. 主会话逐条判断 finding，仅修影响当前交付的有效代码问题，不因材料偏好扩大范围。有效问题回原实施会话；严重未修风险列影响、证据、owner 与“修复或明确接受”的选择，用户未作真实选择不能假记 accepted_risk。
6. 对新修复和真实疑点只做必要定向复验，事先列 file/case 集合，把实际 command/exit/raw 和恢复结果写在对应 finding 处置旁；无改动或疑点时说明无需复跑。不重派第二次正常代码审查，不重做全量上游测试。
7. 保留原始审查与当前 fixed、rejected_invalid、accepted_risk、needs_human 处置。真实修复可报告 resolved，不能改写原 review 或用摘要覆盖失败。核对本次 actual/oracle、未执行事项和覆盖限制；材料问题交 owner，不另建恢复、继任或重绑定任务。
8. 给人读结论并执行 stage-handoff：检查范围、代码修复、原发现和处置、必要验证、业务结果、未知项、上游材料风险及下一步。缺 review/执行原件/严重风险处置时保持 incomplete；继续同任务修复，但不宣称已完成验收或物理交付。

UI 适用时从真实页面和 Component Quality Map 核消费者、状态 owner、typed ViewModel、CSS/token、story/test 更新及已实际产生的浏览器状态；Design.md 与 Experience.md 各自职责不混写。缺扫描、浏览器、fixture、viewport、截图或入口受阻保持 unknown/unavailable，不能把未观察当 N/A 或视觉通过。只有新疑点才重跑相应浏览器检查，先按 isolated-browser-qa 管理隔离、登录态与自建资源清理。

## OCR 能力与回退

先检查 `ocr` 命令和 `ocr --version`。仅命令不存在（ENOENT）或版本低于1.12.9，回退 wh-review 执行同一终末代码审查，保留检测、fallback 原因、原始输入、真实输出和限制。版本检测其它错误不推断未安装；OCR 已装而执行失败、超时或取消时不回退，按真实 unavailable/失败记录。依赖真实 OCR 的测试在未安装时显式 skip 并披露。不能把成功替代伪标成 OCR，也不把不可用写成空 findings。

## 人为门与审查点

confirm 在 make-decision、build-plan、build-prd 收口记录对实际展示材料的真实答复；本阶段不新增日常代码审查确认。确需真人观察的业务效果，复用已有验收确认：向授权业务验收者说明安全权限、数据、真实入口、操作、成功/失败恢复判据、应回传证据及残余风险。未答、未实测、服务缺失或证据冲突保持待确认，不推导业务通过，不要求重复已完成 Talk/Grill。

authorize 只在不可逆 Git/交付动作之前，通过 `runtime/interface/git-authorize.mjs` 核动作、分支和当前 HEAD，HEAD 不一致时拒绝消费旧记录，已有用户授权覆盖动作和范围时按当前 HEAD 重新记录并消费，仅未覆盖的新增动作或范围需用户决定；代码审查结论和验收答复不能代替 commit/push/merge/archive/cleanup 授权。三必留审查点为 build-plan wh-review 合并、build-code 每 Phase OCR、本阶段终末 OCR；不恢复全 Phase 集成审查。

## 使用技能与安全收口

按 `skill-deps.yaml` 直接读取方法；真实消费者检查、定向验证和独立审查按项目分工委派，主会话负责发现处置、用户选择与总结。技能与工具缺失如实说明，不能增加公共命令或新状态对象。原子写入、共享记录冲突保护与工作区核对分别使用现有窄工具，失败保持可见；历史原件只读。

阶段末主会话使用 `skills/stage-handoff/SKILL.md` 保存交接，报告该方法返回的实际不可变绝对路径，供用户交接材料现状、当前代码、真实检查、风险和下一步。交接执行不是门，缺失只披露；不要求固定机器复盘或交接认证。正式阶段事实仍由现有公共流程处理。实现、质量、业务验收、发布和物理 close 分别报告，不互相代填。
