# Task Context 合同

所有 WorkflowHub stage、组件和旁路必须遵守本合同。

## 术语

- `~/.config/workflowhub/config.json` 的 `task_dir`：用户配置的全局 storage root；stage 不直接读取。
- `WORKFLOWHUB_TASK_DIR`：仅用于临时覆盖全局配置；stage 不直接读取。
- `storageRoot`：launcher 内部值，不进入 skill contract 或 stage result。
- `taskPath`：`storageRoot/Projects/<project>/tasks/<task>` 的绝对任务叶目录；唯一跨进程锚。
- `TaskHandle`：当前进程从 taskPath 验证得到的任务记录能力对象。
- `Workspace`：make-decision accepted 提供的受控 worktree 能力对象。
- `ArtifactDir`：Workspace 下 `specs/${task}/` 的受控设计文件能力对象。

## 唯一调用链

```text
Launcher → bootstrapStage() → StageContext → Stage / Pure Worker
```

Launcher 唯一允许读取全局配置和 `WORKFLOWHUB_TASK_DIR` 覆盖并派生 taskPath。stage 和 sidecar 不得读取
storage root。独立官方 sidecar 只接绝对 `--task-path` 并验证 manifest；provider/worker
只收材料内容、父进程解析的绝对路径或受控回调。

## 既有任务 runner 迁移

既有任务只能通过 `scripts/task-migrate-runner-root.mjs` 写入 `runner_root`。调用方必须显式提供
绝对 `task-path`、project、task、runner root 和 stage。入口不从 cwd、target repository 或主
checkout 推断 runner。runner 必须是 Git 顶层，当前 branch 必须精确等于
`task/<project>/<task>`，并具有可读的根级 `AGENTS.md` 与对应
`workflows/<stage>/SKILL.md`。迁移后的 stage bootstrap 必须显式传入实际 runner root，不能用
manifest 中的期望值代替实际值完成自证。

迁移写 create-only identity ref，记录替换前后 manifest SHA-256 与 runner identity，再原子替换
`task.json`。既有 task 的只读认证使用 `task-bootstrap.mjs --task-path=... --runner-root=...
--stage=...`；该模式不读取 storage 配置，也不创建任务。

## StageContext

```text
task: TaskHandle
identity: {projectName, taskId}
manifest: task.json
workspace?: {worktreeRoot, baselineCommit}
artifacts?: ArtifactDir
```

make-decision 没有 Workspace/ArtifactDir。后四阶段由 bootstrap 从 make-decision accepted
建立二者。

## ArtifactDir

通用 namespace：

```text
<worktree_root>/specs/${task}/...
```

stage 不拼该路径，只使用：

```text
ctx.artifacts.path(relativeName)
ctx.artifacts.read(relativeName)
ctx.artifacts.writeAtomic(relativeName, data)
```

relativeName 禁止绝对路径、`..` 和 symlink 逃逸。

## 文件系统威胁模型

TaskHandle 与 ArtifactDir 必须阻断静态 symlink、路径逃逸，以及正常运行中意外发生的祖先
目录替换。每次写入在创建临时文件前和 rename 前都要重新验证受信目录身份；发现变化立即
失败，且不得向任务目录或 artifact 根之外写入。

当前实现不承诺抵抗同一 UID 的恶意进程在每个校验指令之间持续、精准替换目录。完整抵抗
该攻击需要把路径型 I/O 改成基于可信目录 fd 的 `openat`/`renameat` 链。未完成该改造前，
不得宣称具备此安全保证；该边界不影响静态或意外 symlink 必须在写入前 fail-loud 的要求。

## 禁止

- stage/worker 读取 `WORKFLOWHUB_TASK_DIR`；
- 用 cwd、Git remote、branch、issue ID 推断身份；
- 自行拼 `Projects/`、`tasks/`、`specs/${task}`；
- 调用旧 `parseTaskDir`、`resolveTaskRecordPaths` 或读取 `worktree.json`；
- 搜索、alias、latest 或复制文件解决身份缺失。

缺 StageContext、taskPath/manifest 不一致或能力缺失时，在 stage 第一步前 fail-loud。
