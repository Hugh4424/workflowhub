# Research: build-code 深化（M13d）——P0-P3风险定级/L2冒烟/两阶段审查/原子提交/worktree预建

## 背景

M13 系列深化第三阶段，紧接 M13b（build-spec 深化）、M13c（build-plan 深化）。build-code 现状已有 TDD RED/GREEN + content_hash 假绿检测（非阻断）+ 单链 3rd-review（未拆子代理）+ facts.review 结构化产出，缺失 P0-P3 风险定级、L2 集成冒烟、两阶段独立审查+原子提交、worktree 跨任务并行能力。v3 设计文档（`.stage-deepening-milestones-v3.md` M13d 段 line 263-364）已给出权威落地字段定义，本阶段 make-decision/build-spec 已核验一致性并收敛。

## 相关技术 / 已有实现

- `metrics/capture.mjs` 现有字段：command/cwd/git_sha/exit_code/timestamp/content_hash/anomaly_flags；无 mtime、无 base_sha/head_sha、无 risk_level（FR-METRICS-001 需新增四字段）。
- `data-contracts.md` 机制已在 `workflows/build-plan/SKILL.md` Step 1.5 实现生效，M13d 自身的 `specs/m13d-build-code-deepening/data-contracts.md` 将由本阶段（build-plan Step 1.5）自动产出，非跨任务依赖风险。
- 3rd-review 现有 verifier 定义在 `/Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/`；本轮需新增两个独立审查子代理产出 spec-compliance-verdict.md / code-quality-verdict.md（复用同一引擎 codex，非异源，用户已确认接受）。
- `test-routing-advisor` 来源已定位：`multica-agenthub/packages/core/agenthub/skills/test-routing-advisor/SKILL.md`（agenthub 仓库跨仓依赖，同技术体系内，非无主外部黑盒）。
- worktree 状态文件 `tasks/{task-id}/worktree.json` 已由 make-decision 阶段预建（`{"worktree_root": "/Users/Hugh/Hugh/Project/workflowhub/workflowhub", "created_at_stage": "make-decision", ...}`），本 build-plan 阶段直接复用，未损坏。
- 复用技能（本项目自研，非外部引入）：checkpoint-protocol（改造，只取 commit_sha/base_sha/head_sha 字段落 GREEN.json）、review-trigger + verdict-handler（拆分为两个独立审查子代理触发/A-B-C升级判定逻辑）。

## 风险点

- mtime 时序防伪：可被 `touch -t` 篡改、跨文件系统精度不一致、worktree 操作会重置 mtime——已判定安全剧场（F10 四问不达标），**已被用户决策整条移除**（原 FR-ANTIFORGERY-001，非降级，直接去掉），本阶段 plan 不再规划该机制。
- 细粒度原子提交（FR-COMMIT-001）：提交噪音、rebase 冲突风险；缓解方式为提交时机集中在 orchestrating skill、语义完整点才提交，实现子代理禁止自行 commit。
- 两阶段独立审查共用同一引擎（codex）不构成异源覆盖，仅覆盖"自审自判"这一根因，不覆盖"引擎系统性盲区"——用户已确认接受此局限（Known Gap #3，非阻断）。
- L2 集成冒烟外部技能（test-routing-advisor）跨仓依赖，维护主体在 agenthub 仓库，build-plan 阶段需声明版本/路径锁定。
- 所有质量检查须"记录事实、不阻断"（宪法 F3/Q1）：risk_level 定级失败、L2 冒烟失败均只记录+escalate_to_human，不可做成硬阻断门禁。

## 结论 / 建议

方向已在 make-decision/build-spec 阶段充分收敛，5 项 Known Gaps 中 4 项已关闭，1 项（第二异源审查引擎不可用）用户已确认接受为非阻断状态。本 build-plan 阶段的主要工作是把 spec 的 8 个 FR（FR-RISK-001/FR-SMOKE-001/FR-REVIEW-001/FR-REVIEW-002/FR-COMMIT-001/FR-WORKTREE-001/FR-REUSE-001/FR-METRICS-001）分解为按 FR 排序、可执行的 phase 任务列表，并对四个受影响子系统（workflows/build-code/SKILL.md、metrics/capture.mjs、skills/reuse-registry.md、worktree.json 协议）做数据契约与约束核对，无需引入新的调研维度。
