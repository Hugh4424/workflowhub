---
name: architect-code-review
description: Optional standalone code review of a WorkflowHub implementation diff, covering correctness, lifecycle, security, real consumers, simplification, documentation and test strength.
---

# Architect-Code-Review

来源：DeepSeek Harness `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` 的
`dsh-code-review`，并吸收同一版本的以下 review lens：

- `dsh-find-simplifications`：检查无 consumer、重复控制面、无必要复杂度和手写替代品；
- `dsh-doc-standards`：检查改动涉及的文档、JSDoc、接口说明是否与实现一致；
- `dsh-prose-standard`：检查改动的注释、错误文本、提示词和说明是否完整、准确、放置合理；
- `dsh-trim-cot-leakage`：删除设计过程、PR 编排和审查过程泄漏到产品文本中的叙述。

四项 lens 合并为一次独立调用。本技能保留供人工显式调用和历史结果解读。正常流程由
build-code 对每个 Phase 发起一次 OCR 审查，随后完成最终聚合测试与逐 AC 判断；verify-code
对最终 worktree 发起一次 OCR 独立审查。

## 边界

本技能可独立审查指定 diff，供显式诊断使用。正常 build-code Phase OCR 审查经 public
`review --action=record` 产生事实，由 `run` 的 `receipts.review` 消费；verify-code 的一次
终末 OCR 审查由 `receipts.quality_review` 消费。历史 integration 结果只读保留。本技能
只检查代码、真实消费者、相关接口、测试和实现风险；上游材料仅作背景。

独立调用时，缺少任务审查 receipt、AC evidence 或 provider 结果不妨碍阅读和报告代码问题，但本技能输出不能替代这些正式质量事实。push、merge 和发布仍是独立操作。

## 审查顺序

1. 先确认当前 diff、基线和真实入口；不要只看单元测试或人工挂载的 fixture。
2. 检查正确性、接口两端、状态机、生命周期、并发、取消、资源释放、错误传播、权限和安全边界。
3. 追踪每个改动的真实 consumer，检查是否出现重复控制面、无 consumer 的抽象、consumer-specific 泄漏、不必要的兼容分支、重复表示或可以直接删除的复杂度。优先复用已有路径；没有真实 consumer 的生产代码直接报告。
4. 只有改动触及文档或产品文本时，检查文档/JSDoc/接口说明与实现一致，注释只保留非显然的约束，错误文本和提示词保留完整命题，不把设计会话、PR 流程或审查编排写进用户可见文本。无相关改动时跳过该 lens，不创建额外记录。
5. 检查测试是否真正走过关键入口、外部状态和失败边界；根据改动范围运行最小的受影响检查，不以绿色命令本身代替行为证明，也不条件反射地重跑全量回归。
6. 只报告影响代码交付的 findings，提供文件、行号、影响、根因和最小修复建议。

优先检查 correctness、lifecycle、security 和 required behavior；其次是 consumer fit、可删复杂度和文本质量。优先报告有代码锚点且影响交付的问题。

## 唯一输出契约

只有真实完成当前代码审查后，才输出一个 JSON 对象；实际输出不得带 Markdown 围栏、解释文字或其它顶层字段：

```json
{ "findings": [...] }
```

`findings: []` 仅表示审查确实完成且没有发现问题。审查未完成、执行不可用或结果不确定时，不得用空数组表示成功；把真实不可用原因交给显式调用者，不发布正式 `code_review` 事实。

每条 finding 使用 `severity`、仓库相对路径 `path`、`issue` 和 `recommendation`。`path` 必须指向实际审查的仓库内文件，使用规范 repo-relative 路径，不得含绝对路径、URI、空路径段或 `.`/`..` 段。严重 finding（`severity` 为 `blocking` 或 `major`）还必须包含能定位到实际审查代码的正整数 `line`、`root_cause`、`evidence_kind` 和具体 `evidence`；`evidence_kind` 只能是 `direct`、`inferred` 或 `machine`。这组 path/line/evidence 是 finding 的锚点声明：只有当证据确实支持该文件该行的问题时才输出；无法核实锚点时不得把 finding 作为有锚点的 serious finding 提交。输出只含 findings，不自行添加 task/stage/snapshot 身份、receipt、ref 或 hash。

每条非 `minor` finding 的 `path` 和正整数 `line` 必须对应所审 diff 中真实存在的源码文件和源码行；`evidence` 必须与该行去掉首尾空白后的完整内容逐字相等，不得仅摘子串、改写、概述或跨行拼接。自然语言解释写入 `issue`、`root_cause` 或 `recommendation`。无法核实源码行或完整锚点时，向调用方说明未完成原因；不得用空 `findings` 代替未完成的审查。

## 结果边界

把本技能的 JSON 结果交给显式调用者用于独立诊断或历史对照。当前 build-code Phase
与 verify-code 只消费各自 OCR 路径返回的 canonical `result_ref` 或 unavailable
`attempt_ref`。本技能不生成正式 `code_review` 或 review receipt，也不触发另一次正式审查。

## 处置

主 Agent 负责修复和处置，每条 finding 只能是 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`；原始 finding 必须保留，不把审查失败改写为空 findings，也不要求第二次 review 来证明材料完整。

普通 verify-code 的 OCR 审查与定向复验遵守该 workflow 的一次审查合同；可选的 Architect 诊断不触发额外正式审查轮次。

## 其他 Harness skill 的边界

- `dsh-pre-push-checks`：只有用户明确授权 push 时，才作为 push 前最小检查；不进入 verify-code，也不把 push 当作 review 结论。
- `dsh-merging-stacked-prs`：负责已授权的远端 stacked-PR merge；不在 verify-code 修改远端状态。
- `dsh-doc-site-sync`：只有改动确实涉及 docs site 映射时才单独执行；不作为每次代码审查的固定动作。
- `dsh-translate-docs`：只有用户明确要求翻译时才执行；不因发现文档改动自动触发。
- `dsh-archive-agent-notes`：只处理 Agent Notes 归档；不参与代码质量裁决。
- `record-browser-gif`：只有用户明确要求 UI 交互录制时才执行；GIF 不是 verify-code 交付证据或通过条件。

该适配保留上游代码审查、简化、文档和 prose 规则，供独立调用与历史解读；当前 stage 的正式 review publication 以 OCR 路径的真实结果为准。
