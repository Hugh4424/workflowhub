# 内部调研摘要 - wh-review-rebuild

## 1. 领域背景与术语（来源：explore sub-agent）
- 五段流程（intake/design/plan/apply/test-acceptance）权威定义在 CONTEXT.md
- docs/plain-language-mechanism-design.md 是唯一补充 3rd-review 术语的 docs 文件，specs/ 下无独立术语定义

## 2. codebase 相关实现现状（来源：explore sub-agent）
- 5 个 stage 当前【已经】都传了 --checkpoint=<stage> 参数（make-decision/build-spec/build-plan/build-code/verify-code 各 SKILL.md 均有，行号见下）：
  - workflows/make-decision/SKILL.md:301
  - workflows/build-spec/SKILL.md:183
  - workflows/build-plan/SKILL.md:193
  - workflows/build-code/SKILL.md:103
  - workflows/verify-code/SKILL.md:236
- 3rd-review 本体实现在外部仓库 /Users/Hugh/Hugh/Project/3rd-review/（不在 workflowhub 仓库内）：
  - standalone.sh:41,216 解析 --checkpoint 并转发
  - scripts/run-heterologous-review.mjs:537-547，STAGE_MAP + `stage.startsWith(key)` 前缀匹配路由，STAGE_MAP key 与 5 个 checkpoint 值完全对应
- verifiers/vibecoding/ 下共 11 个合同文件（build-code-reviewer[-contract].md、build-plan-reviewer[-contract].md、build-spec-reviewer[-contract].md、make-decision-detail-reviewer.md、make-decision-direction-reviewer.md、make-decision-reviewer-contract.md、verify-code-reviewer[-contract].md），文件内无 checkpoint 字段，路由完全靠文件名约定+STAGE_MAP 键名
- 仓库内无 wh-review 目录/文件（待新建）

**重要发现（与任务描述存在出入）**：任务描述认为"5 stage 调用时都没传 stage 标识，导致路由失败退回通用合同"。但调研显示，2026-07-04 commit e96c257 已经给全部 5 个 stage 的 SKILL.md 补上了 --checkpoint=<stage> 参数（见下方历史先例小节），且 STAGE_MAP 用 startsWith 前缀匹配，key 与 checkpoint 值完全对应，理论上现在应该能正确路由到 11 份专属合同。这个"从未路由生效"的根因描述可能已经是昨天之前的旧状态，需要向用户确认现状是否已经改变。

## 3. 历史先例与经验教训（来源：tracer sub-agent，commit hash 为证）
- 3rd-review 机制是 workflowhub 自 M6 起原生构建（b2138d3, 2026-06-24），非从 agenthub 迁移；agenthub 相关提交（43dda0b/f272673/62a4356）只涉及 metrics/CI，与 3rd-review 路由无关
- make-decision S5 首次引入三角度异源盲审时（337b06c, 2026-06-30）无 --checkpoint 参数
- S5 简化为单次盲审（da11e45, 同日）时同样无 --checkpoint 参数
- --checkpoint=<stage> 参数是 5 天后统一补加的（e96c257, 2026-07-04），commit message: "so agents have an executable model to follow"
- step-gated-audit phase-2（f63a2d6, 2026-07-03）加 Hook 时同样先漏了调用模板，次日才补全 —— 系统性遗漏，非单点疏忽
- 同类"接口存在但调用链断路"的历史案例：metrics-writer 未接入 verify-code（93ee5db/2b6b092），经异源审查才发现补写
- specs/archive 下无专门讨论 3rd-review 合同路由取舍的 decision-log，只有里程碑归档文档

## 4. 外部生态最佳实践（来源：document-specialist sub-agent，含链接来源）
- Policy-as-Code 分层模式（OPA/Rego）：引擎只认 {input, data, query}，不感知调用方——与"3rd-review 只认 {mode, contract, materials}"思路同构
- ESLint Shareable Config 模式：引擎（AST 遍历+报告）与规则集（shareable config/plugin）分离，项目 extends 对应包即可切换——对应"3rd-review=引擎，wh-review=shareable config"
- cheap→expensive 分级审查：静态分析→自动化测试→AI审查→人工审查，每层独立可替换只传结果摘要给下一层
- Human-in-the-Loop escalation：触发条件必须显式配置，不能依赖"没命中规则就默认放行"
- 静默回退（Silent Fallback）是有明确记录的反面案例：路由不匹配时不发信号、自动降级，调用方以为专属规则生效——工程教训是必须报错或告警，不能静默降级
- 增量+阈值触发优于全量必过人工，避免"橡皮图章"效应

## 5. 已知风险与反向案例（来源：tracer sub-agent）
- 当前设计已知风险点：checkpoint 路由若未来再出现类似"补丁滞后于声明"的情况（合同接口声明与实际调用模板之间的时间差窗口），会重演本次同款问题
- 3rd-review 本体（standalone.sh/run-heterologous-review.mjs）在外部独立仓库维护，workflowhub 内只有占位调用，两仓库变更不同步是潜在风险点

## Sub-agent 执行记录
- explore sub-agent（codebase+术语）：成功，agentId a8d2cbf03e1be9462（注：此为 executor id，实际 explore agentId 见下）
- explore sub-agent（codebase 现状）：agentId ae282acc8f79a8a05，成功
- document-specialist sub-agent（外部最佳实践）：agentId a74269d5028878010，成功
- tracer sub-agent（历史先例+风险）：agentId a1f3c5e8f2049bdf5，成功
- 全部 4 个 sub-agent 均成功，无失败
