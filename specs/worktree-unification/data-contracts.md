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
| **Consumer side** | `build-code` §17 FR-WORKTREE-001、`verify-code` close 阶段（仅可更新 status） |
| **File path** | `{worktree_root}/worktree.json`（worktree 根路径下） |

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
| 返回值 | string | task_dir 绝对路径，供调用方拼接 `{task_dir}/{task-id}/` |

### Validation Rules

优先级顺序（高 → 低）：
1. `WORKFLOWHUB_TASK_DIR` 环境变量（若已设置且非空）
2. `config/workflowhub.yaml` 的 `task_dir` 字段
3. fallback：`~/Knowledge/workflowhub/`

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
| **Contract name** | 每 stage/phase 至少一次 commit 契约 |
| **Owner side** | 每个执行写入的 stage（build-code per phase） |
| **Consumer side** | 后续 stage，通过 git log / git show 读取前序产物 |

### Required Fields / Types

| 规则 | 说明 |
|------|------|
| commit 触发时机 | 每个 stage/phase 完成时至少执行一次 `git add + git commit`（不 push） |
| push 策略 | 仅 verify-code close 阶段人工确认后一次性推送（`--no-ff` merge） |
| 禁止项 | 其他 stage 不得执行 `git push` |

### Version Compatibility Notes

- build-code §17 需新增 per-phase commit 触发逻辑
- push 策略从"各 stage 自行决定"收拢为"verify-code close 统一执行"
