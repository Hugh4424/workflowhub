# Progress
1. 当前 HEAD `f1d19f4`；本轮只修复模板合同回归，起点仍为 `f98b842`。
2. 基线：retention 12/12；m12+spec 20 通过、4 失败，skip 0。
3. 失败范围：版本句号、Constitution JSON、非行为 gate 规则、两个旧花括号断言。
4. 任务 1 完成：plan/tasks 精确版本、Constitution JSON、versioned_refs JSON 和非行为 gate 已恢复并由 JSON 解析测试锁定。
5. 两项 RED 已记录：版本句号令 m12 2 个版本断言失败；自然语言 Constitution binding 令 JSON 断言失败；均已恢复。
6. 任务 2 完成：spec 断言改为产品身份、禁止 host identity、FR grammar 的等价语义；retention 基线重建为 `f98b842` 全量 H1-H3 映射。
7. 最大风险：可读说明再次替代机器合同，或 retention 映射不再对准真实起点；已用 JSON 和 instruction-residue 断言覆盖。
8. 仅白名单修改；不改 core/schema/workflow/wh-review/依赖或发布链。
9. Active blockers：无合法 TaskHandle；stage 两套测试缺 clean worktree 的 `ajv` 解析；均已写 BLOCKED，不伪造材料、不创建依赖链接。
