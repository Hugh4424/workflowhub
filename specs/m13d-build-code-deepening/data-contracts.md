# Data Contracts: m13d-build-code-deepening

跨模块/跨阶段数据契约，从 spec.md §4 FR、§5 关键实体与数据、§6 模块划分提取。

## 1. evidence 五件套

| 契约名 | Owner 侧 | Consumer 侧 | 必填字段 | 校验规则 | 版本兼容 |
|---|---|---|---|---|---|
| phase-N-RED.json | build-code orchestrating skill | verify-code / M13e 查痕 | phase_id, content_hash, ts, risk_level | risk_level ∈ {P0,P1,P2,P3}；字段必须存在，值可暂缺但不可省字段 | 新增 risk_level，向后兼容旧文件（历史文件无此字段时按缺失处理，不报错） |
| phase-N-GREEN.json | build-code orchestrating skill | verify-code / M13e 查痕 | phase_id, content_hash, ts, risk_level, commit_sha, base_sha, head_sha | commit_sha 须为合法 git SHA；base_sha/head_sha 成对出现 | 新增四字段（commit_sha/base_sha/head_sha/risk_level），旧字段不变 |
| l2-integration-test-report.json | build-code（test-routing-advisor 触发） | verify-code / M13e 查痕 | routing_tier, result(pass/fail), ts | routing_tier ∈ {simple,feature,fullstack}；result 失败不阻断 | 新文件，无历史版本 |
| spec-compliance-verdict.md | 独立审查子代理1（3rd-review） | build-code orchestrating skill / verdict-handler | verdict(pass/revise_required), findings | 仅含 spec 合规性维度，不与 code-quality 交叉 | 新文件 |
| code-quality-verdict.md | 独立审查子代理2（3rd-review） | build-code orchestrating skill / verdict-handler | verdict(pass/revise_required), findings | 仅含代码质量维度，不与 spec-compliance 交叉 | 新文件 |

## 2. worktree.json

| 契约名 | Owner 侧 | Consumer 侧 | 必填字段 | 校验规则 | 版本兼容 |
|---|---|---|---|---|---|
| tasks/{task-id}/worktree.json | make-decision 阶段（首建）| build-spec/build-plan/build-code/verify-code（四阶段均读） | worktree_root, created_at_stage, ts | 文件损坏时不读取损坏内容，escalate_to_human；不存在时兜底自建 | 已在本任务生效（本 build-plan 阶段已确认复用，见 research.md） |

## 3. facts.tests / facts.tasks risk_level 挂载

| 契约名 | Owner 侧 | Consumer 侧 | 必填字段 | 校验规则 | 版本兼容 |
|---|---|---|---|---|---|
| facts.tests[].risk_level | build-code §1 风险定级步骤 | verify-code / M13e 查痕 | risk_level | P0/P1/P2/P3 之一，不为 null；P0 触发覆盖提示日志 | 局部字段挂载，不进 metrics 全局 CORE_FIELDS（与 v3 设计文档一致） |

## 4. metrics/capture.mjs 新增字段

| 契约名 | Owner 侧 | Consumer 侧 | 必填字段 | 校验规则 | 版本兼容 |
|---|---|---|---|---|---|
| capture.mjs 输出扩展 | `workflows/build-code/capture.mjs`（spec.md 泛称"metrics/capture.mjs"，仓库实际路径以此为准，独立审查发现后订正） | build-code orchestrating skill / evidence JSON | commit_sha, base_sha, head_sha, risk_level | 值可为 null 但字段必须存在 | 向后兼容，现有 command/cwd/git_sha/exit_code/timestamp/content_hash/anomaly_flags 字段不变 |

## 5. skills/reuse-registry.md 条目格式

| 契约名 | Owner 侧 | Consumer 侧 | 必填字段 | 校验规则 | 版本兼容 |
|---|---|---|---|---|---|
| reuse-registry.md 条目 | build-code 实施阶段（迁移执行） | 任意阶段查阅已复用技能来源 | 技能名, 来源字段 | 三个新条目（checkpoint-protocol/review-trigger/verdict-handler）来源字段标注"本项目自研"，不写外部URL | 合并原根目录+config/两份重复文件后的唯一权威版本 |
