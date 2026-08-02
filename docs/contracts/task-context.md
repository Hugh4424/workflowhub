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

## 每次调用认证与遗留迁移

新任务必须声明 `execution_mode=per_invocation`，且 `task.json` 不含 `runner_root` 或
`runner_oid`。Launcher 每次只接受显式绝对 runner root、stage 和
可选 run id；不得从 cwd、target repository、remote 或任务记录猜 runner。

runner 必须是 canonical Git 顶层、符合任务 branch，HEAD 是完整提交，工作树 clean，并含
普通文件形式的 `AGENTS.md`、`CONSTITUTION.md` 和 `workflows/<stage>/SKILL.md`。认证计算
提交与合同内容身份，create-only 写入 `identity/executions/<run>.json` 后才建立
StageContext。任务清单不保存 runner 绝对路径；同一 run/同一 bytes 可幂等 replay，同一 run
不同来源或内容必须冲突。该认证只证明执行来源，不是 Q3 的质量审查。

没有 `execution_mode` 的旧任务只读保留为审计资料。当前调用不验证、也不跟随其 historical
runner、migration 或 replacement 链；新任务始终使用本节定义的 `per_invocation` 认证。

## 历史恢复记录

历史 `recovery`、`continuation`、`rebind` 与 runner replacement 记录只用于审计和排错。
它们不授权、不阻止、也不改变当前任务的正常执行。正常工作只读取当前四份材料；材料变更后，
重新采集当前测试、验收证据和独立审查即可。正式 verify/close 仍对这些当前质量事实 fail-closed。

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
