# 3rd-review 报告 — specs/m13c-build-plan-deepening/spec.md

- 审查日期：2026-07-01
- 引擎：codex（异源，trueCrossEngine: true）
- 模式：lightweight (no-manifest)
- 轮次：3 轮（escalate_to_human，revise 循环达上限未收敛）
- verdict: **escalate_to_human**（底层每轮裁决均为 revise_required）
- anti-forgery: lightweight (no-manifest)
- 工作目录：specs/m13c-build-plan-deepening/3rd-review-work/tasks/spec-20260701T032953Z-fa393e/

---

## Summary

The spec is directionally complete, but revision is required before implementation because several acceptance and runtime semantics conflict, especially placeholder blocking, data-contract prerequisite behavior, and the unresolved 3rd-review plan-reviewer dependency. Fix those contradictions and make task_dir verification executable rather than documentary.

---

## Findings（6 条）

### Blocking / High（3 条）

1. **spec.md:199** — FR-TASKS-001 与 AC-13 语义矛盾：FR-TASKS-001 要求 placeholder 阻止后续阶段，AC-13 仅将其作为任务条目标记而非阶段门。行为矛盾且不可测。
   - 建议：选定一个语义并全局统一。若 placeholder 应停止推进，更新 AC-13 加入硬停；若仅为注释，弱化 FR-TASKS-001 并删除"阻止后续阶段启动"。

2. **spec.md:169** — FR-DATACONTRACTS-002 混用"流程暂停"与"非阻断门/non-blocking escalation"语义，实现者无法判断 data-contracts.md 缺失时应继续还是停止。
   - 建议：确定唯一行为：要么缺失则阻断 tasks.md 生成，要么记录 warn 并继续；对齐 FR-DATACONTRACTS-002、场景和 AC 措辞。

3. **spec.md:53** — spec 声称未跨系统边界/外部依赖（B 档），但 plan-reviewer 依赖 3rd-review 基础设施且附录 A 确认相关文件不在 workflowhub 仓库中，构成真实的跨仓库/路径依赖，档位判断有误。
   - 建议：将 plan-reviewer contract 作为显式 in-scope 产物引入本仓库，或标记为外部依赖并相应提升档位/风险/AC，并增加可调用路径的验收检查。

### Non-blocking / Medium（3 条）

4. **spec.md:289** — Spec-Purity 自检声称无 /Users/ 绝对路径，但附录 A 包含 /Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/，自检结果失实。
   - 建议：用仓库相对路径或声明的外部引用替换绝对路径，并如实更新 Spec-Purity 结果。

5. **spec.md:241** — AC-16 允许"代码或文档"均可通过 task_dir 消费验收，而 FR-TASKDIR-001 要求真实解析器在文件访问前运行，文档证明无法验证实现。
   - 建议：AC-16 改为仅允许可执行解析器用法，文档仅作辅助证据。

6. **spec.md:243** — AC-17 要求 npm test green，但 spec 未确认本仓库使用 npm 或对应测试套件存在，可能形成虚假验收门。
   - 建议：引用仓库实际测试命令，或改写为"项目测试套件 green 且包含 task_dir parser 测试"由 build-plan 阶段落实。

---

## 结论

- 3 条 blocking（high）、3 条 non-blocking（medium）
- 三轮均为 revise_required，escalate_to_human 触发原因：revise 循环达上限 3 轮未收敛
- 按 build-spec SKILL.md §3.7 / FR-REVIEW-001/002：记录 verdict + findings，非阻断门，推进不受阻
- 原始 verdict JSON：specs/m13c-build-plan-deepening/3rd-review-work/tasks/spec-20260701T032953Z-fa393e/reviews/verdict-round-3.json
