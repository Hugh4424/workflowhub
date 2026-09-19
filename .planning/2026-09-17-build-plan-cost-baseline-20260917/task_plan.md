# Task Plan: build-plan-cost-baseline-20260917

## Goal
严格执行 WorkflowHub build-plan 的 13 个步骤，产出并验证同一任务的 `plan.md` 与 `tasks.md`；本 planning session 只规划 build-plan，禁止进入 build-code。

## Next Step
完成 step 2 定向实现调研并将 exact anchors、consumer、signature 与 targeted test commands 回填到 plan 草案。

## Current Phase
Step 2 — conditional-spec-research

## Execution Plan — build-plan 13 Steps

### Step 1: read-current-materials
- [x] 读取冻结的 decision-log/spec 与 build-plan SKILL/steps 契约
- [x] 建立 26 OI、38 FR、38 AC 的实现映射索引
- **Status:** complete

### Step 2: conditional-spec-research
- [ ] 已触发：执行跨仓 anchor / consumer / signature / targeted-test-command 调研
- [ ] 只补实现规划所需事实，不改需求方向，不执行实现或测试
- **Status:** pending

### Step 3: testing-system-blueprint
- [ ] 为主仓与 3rd-review 两仓定义受影响测试路由
- [ ] 遵守只跑受影响针对性测试、禁止无范围全量回归
- **Status:** pending

### Step 4: spec-plan
- [ ] 起草 `plan.md`，明确跨仓顺序、模块边界、依赖和回滚点
- [ ] 每个实施项绑定 FR/AC/PFACT/SCN
- **Status:** pending

### Step 5: simplicity-guard
- [ ] 删除重复层、收窄越界方案、复用既有机制
- [ ] 检查净减或持平规则及已授权例外
- **Status:** pending

### Step 6: plan-eng-review
- [ ] 审查实现可行性、模块接缝、顺序和最小改动面
- [ ] 将问题写回计划，不用下游补需求
- **Status:** pending

### Step 7: test-routing-advisor
- [ ] 将每个变更批次路由到具体测试文件/命令
- [ ] 标出跨仓测试先后关系与失败归属
- **Status:** pending

### Step 8: spec-tasks
- [ ] 生成 `tasks.md`，拆成可独立验证的小任务
- [ ] 每项任务含输入、产物、验收证据、owner 和依赖
- **Status:** pending

### Step 9: review-plan
- [ ] 对冻结的 plan/tasks 发起异源审查并保留原始事实
- [ ] unavailable/partial 保持原样，不改写为通过
- **Status:** pending

### Step 10: main-agent-disposes-findings
- [ ] 主会话逐条处置 findings；方向缺口回 make-decision 增量决策
- [ ] 修复后重新验证 plan/tasks，不进入 build-code
- **Status:** pending

### Step 11: final-spec-analyze
- [ ] 检查 decision → spec → plan → tasks 的双向覆盖和零悬空
- [ ] 如实记录 advisory missing/unavailable
- **Status:** pending

### Step 12: publish-plan-result
- [ ] 经用户确认后发布 plan/tasks 与阶段事实
- [ ] 交接只说明下一步，不执行 build-code
- **Status:** pending

### Step 13: stage-reflection
- [ ] 发布 build-plan stage-reflection.v2 六区块复盘
- [ ] 核验 quality_status、quality_missing、git 范围和材料绑定
- **Status:** pending

## Hard Boundaries
- `decision-log.md` 已冻结（F1），build-plan 不得改写。
- build-plan 只可细化 `plan.md` 与 `tasks.md`；不得修改 specs 之外的代码。
- 本 planning session 禁止进入 build-code、禁止执行实现任务。
- 不改 `~/.config/workflowhub/config.json` 或 `~/.config/3rd-review/config.json`，不减少 provider 派发。
- `specs/archive/**` 只读。

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 使用独立 planning session | 不覆盖根部旧 plan，也不切换到历史 plan 内容 |
| 13 步逐步执行，不跳阶段 | 遵循 WorkflowHub build-plan 标准流程 |
| 只规划、不进入 build-code | 用户明确要求本次轻量初始化且禁止越界 |
| 两个审计 agent 暂不启动 | 初始化阶段仅预留 ID，后续由主会话按步骤派发 |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| 无 | — |
