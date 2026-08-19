---
name: dsh-code-review
description: Review the current WorkflowHub implementation as a code-review subject, with emphasis on correctness, lifecycle, security, consumer fit, simplification, changed documentation and real test strength.
---

# dsh-code-review（WorkflowHub composite）

来源：DeepSeek Harness `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` 的
`dsh-code-review`，并吸收同一版本的以下 review lens：

- `dsh-find-simplifications`：检查无 consumer、重复控制面、无必要复杂度和手写替代品；
- `dsh-doc-standards`：检查改动涉及的文档、JSDoc、接口说明是否与实现一致；
- `dsh-prose-standard`：检查改动的注释、错误文本、提示词和说明是否完整、准确、放置合理；
- `dsh-trim-cot-leakage`：删除设计过程、PR 编排和审查过程泄漏到产品文本中的叙述。

这些规则在一个 `dsh-code-review` 调用内执行，不新增 skill dispatch、provider 调用、receipt、控制面或 verify-code 轮次。

## 边界

这是 verify-code 唯一的代码审查 lens，不是材料审计器、AC 覆盖器或证据门禁。它只消费当前代码 diff、真实消费者、相关接口、测试和明确的实现风险；`decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 只作为已经完成的上游背景，不在本阶段重新验证或补写。

不把以下内容变成 verify-code 的代码门禁：缺少 receipt、AC evidence、task completion、provider verdict、历史快照、人工确认、push 前检查或 merge 条件。上游材料问题交回对应 stage；push、merge 和发布仍是用户明确授权后的独立操作。

## 审查顺序

1. 先确认当前 diff、基线和真实入口；不要只看单元测试或人工挂载的 fixture。
2. 检查正确性、接口两端、状态机、生命周期、并发、取消、资源释放、错误传播、权限和安全边界。
3. 追踪每个改动的真实 consumer，检查是否出现重复控制面、无 consumer 的抽象、consumer-specific 泄漏、不必要的兼容分支、重复表示或可以直接删除的复杂度。优先复用已有路径；没有真实 consumer 的生产代码直接报告。
4. 只有改动触及文档或产品文本时，检查文档/JSDoc/接口说明与实现一致，注释只保留非显然的约束，错误文本和提示词保留完整命题，不把设计会话、PR 流程或审查编排写进用户可见文本。无相关改动时跳过该 lens，不创建额外记录。
5. 检查测试是否真正走过关键入口、外部状态和失败边界；根据改动范围运行最小的受影响检查，不以绿色命令本身代替行为证明，也不条件反射地重跑全量回归。
6. 只报告影响代码交付的 findings，提供文件、行号、影响、根因和最小修复建议。

优先级是 correctness、lifecycle、security、broken required behavior，其次才是 consumer fit、可删除的复杂度和文本质量。一个有代码锚点的真实 blocker 比一串没有行为影响的建议更重要。

## 输出与处置

provider 只返回 `findings`。主 Agent 负责修复和处置，每条 finding 只能是 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`；原始 finding 必须保留，不把 provider 失败改写为空 findings，也不要求第二次 review 来证明材料完整。

一次 verify-code 只允许一次架构师代码审查、一次主 Agent 修复、一次异源代码审查和一次收尾修复。复核只确认这两轮中发现的代码问题是否已处置，不开启第三轮。

## 其他 Harness skill 的边界

- `dsh-pre-push-checks`：只有用户明确授权 push 时，才作为 push 前最小检查；不进入 verify-code，也不把 push 当作 review 结论。
- `dsh-merging-stacked-prs`：负责已授权的远端 stacked-PR merge；不在 verify-code 修改远端状态。
- `dsh-doc-site-sync`：只有改动确实涉及 docs site 映射时才单独执行；不作为每次代码审查的固定动作。
- `dsh-translate-docs`：只有用户明确要求翻译时才执行；不因发现文档改动自动触发。
- `dsh-archive-agent-notes`：只处理 Agent Notes 归档；不参与代码质量裁决。
- `record-browser-gif`：只有用户明确要求 UI 交互录制时才执行；GIF 不是 verify-code 交付证据或通过条件。

该适配保留上游代码审查、简化、文档和 prose 规则，但删除与 DeepSeek Harness 专属目录、PR/CI 和宿主流程绑定的要求，以符合 WorkflowHub 宪法的五阶段边界和“质量事实不是工作许可证”原则。
