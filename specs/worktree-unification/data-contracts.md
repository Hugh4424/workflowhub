# Data Contracts — worktree-unification

**task-id**: worktree-unification
**date**: 2026-07-04
**来源**: 从 specs/worktree-unification/spec.md 提取跨阶段边界数据契约

---

## Contract 1: worktree.json

| 字段 | 说明 |
|------|------|
| **Contract name** | `worktree.json` — 跨 stage worktree 状态契约 |
| **Owner side** | `make-decision` stage（首次写入全部 6 字段） |
| **Consumer side** | `build-code` §17 FR-WORKTREE-001、`verify-code` close 阶段（仅可更新 status）、`build-spec` 阶段（读取 `target_repo_root`/`worktree_root`，缺失时 fail-loud）、`build-plan` 阶段（读取 `target_repo_root`/`worktree_root`，缺失时 fail-loud）；consumer 通过已知的 `task_tracking_root`（从环境变量或 yaml 配置解析，与 worktree.json 本身无关）拼接 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 得到文件路径并读取；文件内的 `worktree_root` 等字段供读取后内部使用，不用于定位文件自身 |
| **File path** | `{{task_tracking_root}}/tasks/{task-id}/worktree.json`（任务跟踪目录下，由 make-decision 写入） |

### Required Fields / Types

| 字段名 | 类型 | 约束 |
|--------|------|------|
| `target_repo_root` | string | 绝对路径（以 `/` 开头）；make-decision cwd 首次探测并固化，后续只读 |
| `worktree_root` | string | 绝对路径（以 `/` 开头）；任务专用 worktree 目录 |
| `branch` | string | 格式 `^workflowhub/[a-z]+(-[a-z]+){1,2}$` |
| `created_by_stage` | string | 值域固定 `["make-decision"]`；其他值 fail-loud |
| `push_policy` | string | 值域固定 `"verify-code-only"`；其他值 fail-loud |
| `status` | string | 值域 `["active", "cleaned"]`；初始写入为 `"active"` |

### Validation Rules

**通用校验（status=active 和 status=cleaned 均执行）**：
- 所有 6 个字段必须存在且非空
- `target_repo_root` 和 `worktree_root` 必须为绝对路径（以 `/` 开头）
- `push_policy` 仅允许 `"verify-code-only"`
- `status` 值域为 `["active", "cleaned"]`
- `created_by_stage` 值域固定为 `["make-decision"]`
- `branch` 必须匹配正则 `^workflowhub/[a-z]+(-[a-z]+){1,2}$`

**active-only 校验（status=active 时额外执行）**：
- `worktree_root` 目录必须实际存在于文件系统
- `git worktree list --porcelain` 输出中必须包含 `worktree_root`（防止僵尸目录）
- `branch` 必须为当前 worktree 的 HEAD 分支名

### Write Permission Rules

| 写入方 | 允许操作 |
|--------|----------|
| `make-decision` | 首次写入全部 6 字段（含 status="active"） |
| `verify-code` close | 仅允许将 status 从 `"active"` 更新为 `"cleaned"` |
| 其他 stage / 其他字段 | 一律禁止，违反则 fail-loud |

### Version Compatibility Notes

- `status=cleaned` 时只做通用校验，拒绝被复用（报错"该 task 已归档，须新建 task-id"）
- build-code §17 旧"worktree.json 缺失时自动创建 worktree"fallback 路径被明确废除；缺失时 fail-loud + escalate_to_human

---

## Contract 2: task_dir 路径解析契约

| 字段 | 说明 |
|------|------|
| **Contract name** | `WORKFLOWHUB_TASK_DIR` 环境变量 / `core/task-dir-parser.mjs` 输出契约 |
| **Owner side** | `core/task-dir-parser.mjs` — 解析并输出 task_dir 绝对路径 |
| **Consumer side** | 所有读写任务跟踪文件的 stage（make-decision、build-code、verify-code 等） |

### Required Fields / Types

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 返回值 | string | `task_tracking_root` 绝对路径（不含 `/tasks/{task-id}` 段）；所有 consumer 拼接完整路径时统一写 `{{task_tracking_root}}/tasks/{task-id}/...` |

### Validation Rules

优先级顺序（高 → 低）：
1. `WORKFLOWHUB_TASK_DIR` 环境变量（若已设置且非空）
2. `config/workflowhub.yaml` 的 `task_dir` 字段
3. 两者均缺失 → **fail-loud**（明确错误信息，exit 非零，无 fallback）

**删除旧硬编码 fallback**：`~/Knowledge/workflowhub/` 不再作为 fallback（与 FR-WORKTREE-ENVVAR-003、tasks.md T001 一致）。

**yaml `task_dir` 后缀裁剪规则（唯一权威定义）**：`parseTaskDir()` 在读取 yaml `task_dir` 字段值后，若该值以 `/tasks` 或 `/tasks/` 结尾（至多裁剪一次），则自动裁掉该后缀，返回纯 `task_tracking_root`。`WORKFLOWHUB_TASK_DIR` 环境变量值不做裁剪（调用方须自行确保传入正确的 `task_tracking_root`）。裁剪逻辑折叠在 `parseTaskDir()` 内部，**不暴露独立公开函数 `normalizeTaskTrackingRoot()`**。此规则防止 yaml 遗留 `/tasks` 后缀导致 `/tasks/tasks/{task-id}` 路径双重拼接。

解析失败时 fail-loud，不静默 swallow。

### Version Compatibility Notes

- 本次改造：新增 `WORKFLOWHUB_TASK_DIR` env var 优先级，yaml fallback 保留（D1 决策），不破坏已有 yaml 配置调用方

---

## Contract 3: task-id 归一化规则

| 字段 | 说明 |
|------|------|
| **Contract name** | task-id 输入归一化 + 校验契约 |
| **Owner side** | `make-decision` stage（接收用户/上游输入并执行归一化） |
| **Consumer side** | 所有以 task-id 推导产物路径的 stage |

### Required Fields / Types

| 步骤 | 规则 |
|------|------|
| 归一化转换 | 1. 转小写 2. 非字母非数字字符统一替换为连字符 3. 连续连字符合并为单个 4. 去除首尾连字符 |
| 校验 | 归一化后必须匹配 `^[a-z]+(-[a-z]+){1,2}$`（2-3 个纯小写字母词，连字符分隔） |

### Validation Rules

- 归一化后不合规（词数不对、含数字词段）→ fail-loud 拒绝，不做进一步猜测修正
- 数字词段（如 `task-123`）不合法

### Version Compatibility Notes

- 此为新增规则，make-decision 当前无对应章节，本次新增后向前不兼容（旧 task-id 若不符合格式须手动迁移）

---

## Contract 4: per-stage commit 契约

| 字段 | 说明 |
|------|------|
| **Contract name** | 每 stage/phase commit 契约（文件变更必提交，无变更必记录） |
| **Owner side** | 每个执行写入的 stage（build-code per phase 为主要实施者） |
| **Consumer side** | 后续 stage，通过 git log / git show 读取前序产物 |

### Required Fields / Types

| 规则 | 说明 |
|------|------|
| **文件变更 stage/phase → 必须 commit** | 每个产生文件变更的 stage 或 phase，完成后必须执行 `git add + git commit`（不 push）；commit message 须符合 `workflowhub(<stage-or-phase-name>): <描述>` 模式，使提交可追溯到具体 stage/phase |
| **无变更 stage/phase → 禁止空提交，必须记录原因** | 若某 stage 或 phase 无文件变更，**不得**创建空提交（empty commit）或仅含标记信息的无实质变更提交（marker-only commit）。必须将"无变更"原因明确写入该 stage/phase 的 stage-result 或 journal（如 `"no_change_reason": "phase skipped — no files modified"`）；不得静默跳过 |
| **空提交明确禁止** | 任何形式的 `git commit --allow-empty` 或无文件变更的 commit 均被禁止，包括用于标记阶段推进的占位 commit |
| push 策略 | 仅 verify-code close 阶段人工确认后一次性推送（`--no-ff` merge） |
| 禁止项 | 其他 stage 不得执行 `git push` |

### Version Compatibility Notes

- build-code §15 已新增 per-phase commit 触发逻辑（FR-WORKTREE-COMMIT-004）
- push 策略从"各 stage 自行决定"收拢为"verify-code close 统一执行"
- 本 Contract 4 与 spec.md FR-WORKTREE-COMMIT-004 保持一致：文件变更必提交，无变更必记录，空提交禁止
