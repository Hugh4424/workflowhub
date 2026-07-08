# Research: workflowhub 质量收敛（wh-quality-convergence）

## 背景

本任务旨在收敛 workflowhub 全链路交付质量的四个根因：
1. **D1 receipt 校验形同虚设** — 仅验证 schema/格式，不验证真实工作是否完成
2. **D3 project-key 多项目隔离缺失** — 多项目场景下 task-id 无法反查所属 project/repo
3. **D4 决策日志引用准确性存疑** — 此前存在未核实的引用风险
4. **D5 task_dir 配置在 Multica 沙箱不可见** — 环境变量在 agent 沙箱中不可继承

## 已有决策（D1-D6）

D1-D6 已在 make-decision 阶段经 grill+debate+用户批准落盘：
- **D1-B** receipt 真核验（git diff + 测试结果比对），设计已定，代码待 build-code 实现
- **D2** flow_profile 占位字段（full_vibecoding/fast_make_decision_to_code）
- **D3-A** manifest 索引方案（追加式 task-id→repo 映射）
- **D3-B** 索引实现时机（代码待 build-code）
- **D4** 决策日志引用统一至 worktree-unification 原始 decision-log
- **D5** task_dir 配置持久化（~/.workflowhub/config.json），代码待 build-code
- **D6** worktree 碰撞保护维持现状

## 风险点

1. D1-B/D3-B 设计已定但实现待 build-code，build-plan 需确保 plan/tasks 包含这些 FR
2. task-dir-parser.test.mjs 现有测试与 D5 默认值冲突（test 禁止 home 兜底 vs D5 默认 ~）
3. spec 已有 355 行，改动面涉及 validate-stage-result.mjs、task-index.mjs 新增、config.json 接入
4. F10 gate：新增机制均由原始 issue 明确根因驱动，无反过度工程风险

## 结论

质量收敛方向明确，D1-D6 决策已批准。build-plan 阶段需产出 plan.md（含 implementation steps + file list + FR-to-step mapping）和 tasks.md（含 stage grouping + dependency order），关联所有 FR。
