# Research: worktree-unification

**task-id**: worktree-unification
**date**: 2026-07-04
**来源**: 基于 task_dir 内 research/internal-research-summary.md 整合

---

## 背景

### 核心问题

workflowhub 多 stage 任务在 Multica 环境下存在跨 stage 产物断链问题。典型案例（ZHI-65）：make-decision 阶段将 decision-log 写入临时 workdir，但 Multica workdir 生命周期与 agent run 绑定，run 结束后目录被清理，后续 stage checkout 时读不到该产物。

### git worktree 语义

- `git worktree` 允许同一仓库在多个目录同时 checkout 不同分支，`.git` 对象共享但工作区独立
- Multica 临时 workdir 生命周期与 agent run 绑定，task worktree 需跨多个 run 存活，**两者不能是同一目录**
- task worktree 必须建在沙箱生命周期之外的固定路径（如 `task_dir/{task-id}/worktree/` 或同级平级目录）

### 术语区分

- `target_repo_root`：执行 `git worktree add` 的原始 checkout 根路径，由 make-decision 首次探测并固化
- `worktree_root`：任务专用 worktree 目录路径（不同于 target_repo_root）
- `task_dir`：任务跟踪产物根目录（stage-result/journal/decision-log 存放处），**不在 git worktree 内**

---

## 相关技术 / 已有实现参考

### 现有 codebase 状态

- `make-decision/SKILL.md`：完全缺少 worktree 章节，未定义创建/写入 worktree.json 的规则
- `build-code/SKILL.md §17 FR-WORKTREE-001`：已假设上游提供 worktree.json 契约，但上游从未实现——两端契约均为空白
- `core/task-dir-parser.mjs`：硬编码路径，未读取 `WORKFLOWHUB_TASK_DIR` 环境变量；导致不同 agent 实例间路径不一致
- `tasks/step-gated-audit/`：只有 `decision-log.md`，无 `worktree.json`，印证断链是真实发生的
- `scripts/`：当前为空，无任何 ensure-task-worktree 类辅助脚本

### 历史决策

- **2026-07-01 串行复用决策**：build-code/verify-code 已改为按 phase 拆子 issue、串行执行、复用同一 worktree，本次协议需与此兼容
- **path 混淆先例**：decision-log/stage-result/journal 实际在 `task_dir/{task-id}/`，不在 git worktree 的 `specs/` 目录，agent 曾误判

### 外部生态最佳实践

- **"谁创建谁清理"**：清理责任须在协议中明确，不能由各 stage 自行判断
- **平级目录命名**：`{project}-{task-id}` 是主流做法，优于 `.git/worktrees/` 内部路径
- **分支唯一性**：分支名需含 task-id 保证全局唯一，同一分支不能被两个 worktree 同时 checkout

---

## 风险点

1. **task-id 特殊字符**：含空格/斜杠/中文/大小写别名时需 slug 化，spec D3 已定义归一化规则（小写 + 非字母数字替换为连字符 + 2-3 词校验）
2. **僵尸 worktree**：`test -d` 为真但 `git worktree list --porcelain` 不含该路径时，禁止静默复用，必须 fail-loud
3. **分支占用冲突**：分支已被其他 worktree 占用时，禁止 force-checkout，需 fail-loud 并报告占用方路径
4. **环境变量优先级**：`WORKFLOWHUB_TASK_DIR` env var 须优先于 yaml 配置，未设置时 fallback 到 yaml，再 fallback 到 `~/Knowledge/workflowhub/`
5. **路径断链**：target_repo_root 须在 make-decision 阶段的 cwd 上下文首次固化写入，禁止在 task worktree 内重新推导（否则得到 worktree_root，语义错误）
6. **中途失败不可逆动作**：close 流程的 8 步序列（merge + 分支清理）中途失败须停止并 escalate，无自动回滚

---

## 结论 / 建议

### 核心设计方向

1. **worktree.json 作为跨 stage 契约**：6 字段（target_repo_root / worktree_root / branch / created_by_stage / push_policy / status），由 make-decision 首次写入，后续 stage 只读
2. **make-decision 新增 worktree 规则章节**：覆盖 D1-D5 决策（task_tracking_root 读取、task-id 归一化、worktree 创建规则、commit 责任）
3. **core/task-dir-parser.mjs 改造**：WORKFLOWHUB_TASK_DIR 环境变量优先，保留 yaml fallback
4. **build-code §17 删除旧 fallback**：worktree.json 缺失时 fail-loud，不再自动创建 worktree
5. **push 策略收拢**：commit per-stage，push 仅在 verify-code close 阶段人工确认后一次性执行

### 风险缓解

- fail-loud 语义贯穿所有读取 worktree.json 的场景，杜绝静默降级
- close 流程 3rd-review 在不可逆动作前执行，verdict=pass 才允许 merge
- stage-result 存放于 task_dir 而非 repo specs/，隔离过程产物与代码产物
