# S4 方向确认（2026-07-05）

## D1 两层架构（已确认）
- 3rd-review 瘦身为纯异源审查引擎：{mode, contract, materials} → {verdict, findings, actual_mode}，零 stage/轮次知识。
- wh-review 新建，workflowhub 专属：stage→合同映射、5套专属合同、轮次状态、降级/升级、Delta Package、报告渲染。
来源证据：issue feb2e69b 原始需求 + 用户 2026-07-05 确认评论"认同，...".

## D2 pass 自动推进范围收窄（用户澄清，修正原始验收标准#4）
- 原始验收标准写的是笼统"pass 自动推进下一 stage"，用户澄清：**只有 build-spec 和 build-code 两个 stage 的 pass 会自动推进到下一 stage**。
- 其余 3 个 stage（make-decision / build-plan / verify-code）pass 后不自动推进，触发方式留给后续阶段设计。
来源证据：用户 2026-07-05 评论"审查通过（pass）能自动推进到下一个 stage只有build-spec和build-code"。

## D3 build-code SKILL.md §7/§13 文档矛盾——纳入本次决策范围一并清理
- 矛盾内容：§7（L96-117）定义单次 3rd-review 调用产出单一 verdict 直接决定推进；§13（L221-250）定义两个独立 subagent 聚合，`pass` 需两边都 `pass`。§7 L117 有一句事后注释承认已被 §13 取代，但操作指令未删除，双轨并存。
- 采纳解决方向（方向1）：以 §13 为准。§7 主体改写为纯概念说明（3rd-review standalone 是每个 subagent 调用的底层入口），删除 §7 的三态 verdict 处理指令和调用命令模板，仅保留降级规则作为 §13 的补充说明。
- 注意：本次 make-decision 阶段只记录该决策方向，不在本阶段直接修改 build-code/SKILL.md；实际改动由后续 build-code 阶段的实现工作执行。
来源证据：用户 2026-07-05 评论"文档矛盾一起清理" + explore sub-agent 调研（agentId aa1dff85d4c969705）。

## D4 intake 方向节判据（详细规则，现在定案，不留后补）
用于 wh-review 新版 make-decision/intake 专属合同：
- C1 原始需求原文引用：产物需含至少一处原文引用/来源标注；仅概括描述视为不通过。
- C2 决策有证据支撑：每条"选X非Y"结论需附至少一条具体理由（技术约束/风险评估/用户表态）；裸断言视为不通过。
- C3 范围边界明确划分 in/out：in-scope 与 out-of-scope 均需至少一条且互不重叠；只有 in 或表述模糊视为不通过。
- C4 无悬挂开放问题：开放问题数为 0，或均已标注"不阻断当前范围"+跟进 issue 编号；否则不通过。
- C5 方向与上游输入一致：方向结论需覆盖用户明确要求全部条目，无未授权范围扩张；遗漏或擅自扩大视为不通过。
- C6 决策产物格式可机器消费：需含 decision/scope.in/scope.out/open_questions 等标准字段且非空；自由文本块视为不通过。
来源证据：architect sub-agent（agentId a85a98f861db2de37），参考 verifiers/vibecoding 现有 11 份合同判据写法风格。

## D5 verify-code 新鲜性判据（详细规则，现在定案，不留后补）
- F1 代码提交晚于最新 decision-log 更新：实现 commit 时间戳 ≥ decision-log 最后修改时间戳，否则不通过。
- F2 测试覆盖最新验收标准全集：spec.md 中每条 AC-ID 需在 test-strategy.md 的 ac_routes 中有非空路由，否则不通过。
- F3 无引用已废弃字段/接口：diff 范围内不得出现 decision-log/spec 中标记 deprecated/removed/废弃 的字段或接口名，命中即不通过。
- F4 fresh-capture git_sha 与当前 HEAD 一致：evidence/fresh-capture.json 的 git_sha 需与 `git rev-parse HEAD` 精确匹配，不等或缺失即不通过。
- F5 L2/RED/GREEN 报告 content_hash 未变：freshness.mjs checkEvidenceFreshness 的 mtime_violations 需为空数组，否则不通过。
- F6 测试命令与 build-code 产物记录一致：stage-result-build-code.json 的 facts.tests.command 需与本次 fresh-capture 实际执行命令字符串完全一致，不同或缺失即不通过。
来源证据：architect sub-agent（agentId a85a98f861db2de37）。

## D2 补充：非自动推进 stage 的推进方式（用户 2026-07-05 明确）
- make-decision / build-plan / verify-code 这 3 个 pass 后不自动推进的 stage，推进方式确定为：**靠人工确认后推进**（非自动、非留白后补）。
来源证据：用户 2026-07-05 评论"靠人工确认后推进"。

## D6 五个 stage 收尾总结统一模板（用户 2026-07-05 新增要求）
- 要求：5 个 stage（make-decision/build-spec/build-plan/build-code/verify-code）各自的 SKILL.md 收尾步骤都必须调用同一个统一的"大白话总结"模板/渲染脚本生成给用户看的收尾总结，禁止各自写各自格式不一致的收尾逻辑。
- 本阶段（make-decision）已委托 explore 子代理核查 5 个 stage 现状是否已统一，核查结论见本 issue 评论；若现状不统一，需在决策日志中记为待落实项，交由后续实现阶段（build-code）改造。
来源证据：用户 2026-07-05 评论"注意5个stage最后都要有大白话的总结，请检查一下是不是5 stage最后都有调用统一的模板来生成总结"。

## D7 测试方案要求（用户 2026-07-05 新增要求）
- 验收标准新增一条：本次两层架构重设计（3rd-review 瘦身 + wh-review 新建）必须配套一份测试方案，验证新的 wh-review 技能与瘦身后的 3rd-review 技能组合可用，且整个方案能在 workflowhub 全流程中端到端跑通。
- 本阶段只记录该验收要求，具体测试方案设计与执行留给后续 build-plan / verify-code 阶段。
来源证据：用户 2026-07-05 评论"也要有一定的测试方案，保证新的技能和瘦身后的3rd-review技能好用，整个方案能在workflowhub中走通"。

## 状态
D1-D5 均为用户 2026-07-05 明确确认，非 foreman 自行拍板。本文件同时作为 S5 单次盲审的审查输入材料之一（与 make-decision-original-context.md 一并提供给 reviewer，审查方向合理性/问题框架/范围边界合理性）。
