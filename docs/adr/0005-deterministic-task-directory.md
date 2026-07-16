# ADR 0005 — 确定性任务目录与单一 Task 上下文

**状态**：已实施（2026-07-16）
**取代**：ADR 0004

## 背景

ADR 0004 用绝对 `run_dir` 消除 cwd/Git remote 路径推断。用户确认进一步约束：全局只配置
一个任务存储根；任务继续使用人类可读的 project/task 目录；spec、plan、tasks 保存在业务
worktree，方便随代码追踪更新。

本 ADR 保留 ADR 0004 的单上下文、禁止隐式推断、append-only attempt、人工阶段确认、
close 幂等恢复和原子 cutover，同时调整目录与 artifact 权威位置。

五阶段和组件共享的唯一短合同是 `docs/contracts/task-context.md`；各 SKILL 只引用它，不复制
路径算法。

## 决策

### 全局配置

用户配置名称统一为 `task_dir`，环境变量为：

```text
~/.config/workflowhub/config.json
```

```json
{"task_dir":"/Users/Hugh/Hugh/Knowledge"}
```

取值只有一个覆盖源：

1. 已设置 `WORKFLOWHUB_TASK_DIR`：作为临时覆盖，使用其绝对路径；
2. 否则读取 `$XDG_CONFIG_HOME/workflowhub/config.json`，未设置 XDG 时读取
   `~/.config/workflowhub/config.json` 的 `task_dir`；
3. 配置文件不存在时，使用本机用户目录 `os.homedir()`。

不再增加其他项目级或宿主专用配置源。当前机器全局配置为：

```json
{"task_dir":"/Users/Hugh/Hugh/Knowledge"}
```

`task_dir` 必须是绝对目录。对外名称按用户习惯保留；内部统一称 `storageRoot`，禁止把它
命名为 `taskDir`。配置只决定全局存储根，不推断 project、task 或 repo。

这是对旧 `WORKFLOWHUB_TASK_DIR` 语义的 breaking 重定义：旧版把它当某个项目的 `tasks`
目录，新版把它当所有项目的全局根。cutover 前不得让新旧 runtime 同时解释这个变量。

### 确定性任务路径

入口只接受显式 `project_name` 与 `task_id`：

```text
taskPath = <storageRoot>/Projects/<project_name>/tasks/<task_id>
```

示例：

```text
/Users/Hugh/Hugh/Knowledge/Projects/PaperBuilder/tasks/paperbuilder-phase-foundation
```

CLI：

```bash
workflowhub verify-code \
  --project PaperBuilder \
  --task paperbuilder-phase-foundation
```

只有入口层可以派生一次 `taskPath`。之后五阶段、journal、review、route、report、metrics、
close 全部接收同一个受控 Task handle，不再接 project/task 后重新解析。

禁止从以下信息推断 project/task：

- `process.cwd()`；
- Git remote；
- repo/worktree basename；
- branch；
- issue ID；
- 目录扫描、alias 或“最新任务”。

`project_name`、`task_id` 必须是安全的单段名称；禁止空值、`/`、`..` 和路径逃逸。
realpath 后的 `taskPath` 必须仍位于 `<storageRoot>/Projects` 下。

内部契约硬拆为：

```text
resolveStorageRoot() -> absolute storageRoot
deriveTaskPath(storageRoot, projectName, taskId) -> absolute taskPath
openTask(taskPath, expectedProject, expectedTask) -> TaskHandle
```

`resolveStorageRoot()` 只能在 launcher 调用；`deriveTaskPath()` 只能调用一次；`openTask()`
接收的永远是任务叶目录，不得再拼 `Projects/.../tasks/...`。stage/sidecar 只能拿 TaskHandle。

### 创建任务

```bash
workflowhub task create \
  --repo-root /absolute/PaperBuilder \
  --project PaperBuilder \
  --task paperbuilder-phase-foundation \
  --issue ZHI-138
```

`--project` 可省略；仅 create 命令可把显式 `--repo-root` 的 basename 作为一次性默认值，
并在执行前展示最终 project/task/path 供确认。stage 运行时绝不再推断。

repo basename 冲突时必须显式给唯一 `--project`，不自动编号、不看 remote。已存在目录时
create 失败；继续任务必须使用 stage/resume 命令。

### 任务目录

```text
<taskPath>/
  task.json
  results/<stage>/attempt-0001.json
  results/<stage>/accepted.json
  journal.jsonl
  reviews/
  evidence/
  operations/close/
  .lock
```

不再使用 `run_dir`、`runs/<opaque-id>` 或独立 `worktree.json`。

### task.json

创建后不可变：

```json
{
  "schema_version": "1.0.0",
  "task_id": "paperbuilder-phase-foundation",
  "project_name": "PaperBuilder",
  "created_at": "2026-07-16T00:00:00Z",
  "target_repo_root": "/absolute/PaperBuilder",
  "issue_ids": ["ZHI-138"],
  "inputs": {}
}
```

入口必须同时校验目录中的 project/task、CLI 参数和 manifest 三者一致。不一致立即失败。
issue ID 只是 metadata，不参与路径。

`task.json` 不放可变 status、stage map、updated_at、lock 或 worktree 状态。状态由 immutable
attempt/accepted 与 journal 推导。worktree 只来自 make-decision accepted result。

### Task 模块

唯一 API：

```text
openTask(taskPath, expectedProject, expectedTask)
readAccepted(stage)
readInput(slot)
publishAttempt(stage, data)
acceptAttempt(stage, attemptRef, humanConfirmationRef)
appendJournal(event)
reviewDir()
lock() / unlock()
```

所有 task record 路径常量、realpath/逃逸校验、原子写和 append-only 规则只存在 Task 模块。
禁止 stage/sidecar 调用旧 parser、`resolveStorageRoot()`，或自行拼接 storage/project/task。

### Stage bootstrap 与进程边界

统一三层，禁止跨层发现身份：

```text
Launcher → StageContext / TaskKernel → Pure Worker
```

唯一公开 bootstrap：

```text
bootstrapStage(stage, {projectName, taskId, taskPath?}) -> StageContext
```

- 顶层 CLI 通过 project/task 调用 launcher；launcher 唯一允许读取
  全局配置与可选的 `WORKFLOWHUB_TASK_DIR` 覆盖、解析 `storageRoot`、派生 `taskPath`。
- 同进程 stage、journal、route、report、close 只持 `StageContext`/`TaskHandle`。
- 独立 sidecar 不读取环境变量，只接父进程传入的绝对 `--task-path`，调用
  `openTask(taskPath, expectedIdentity)` 验证 manifest；不得再次派生。
- provider/组件 worker 只接材料内容、父进程已解析的绝对 input/output path，或受控回调；
  不接 project/task/root，不访问真实仓库做身份发现。
- 首版不建立 kernel endpoint/capability token。无法 in-process 的官方 sidecar 只允许上述
  `--task-path` 模式；纯 provider 继续使用冻结 packet。

`StageContext` 最少包含：

```text
task: TaskHandle
identity: {projectName, taskId}
manifest: task.json
workspace?: {worktreeRoot, baselineCommit}
artifacts?: ArtifactDir
```

make-decision 没有 workspace/artifacts；后四阶段的 bootstrap 必须从 make-decision accepted
解析并校验 workspace，再创建 ArtifactDir。stage 不自己完成这些前置步骤。

`taskPath` 与 project/task 同时传入时，bootstrap 必须校验派生路径、绝对 taskPath 与
manifest 三者完全一致；不一致 fail-loud，不能规定隐式优先级。

跨进程传递的稳定锚是绝对 `taskPath`，不是 JS 对象。每个进程可从同一 taskPath 创建自己
的受控 handle，但只有 launcher 能从全局 root 派生 taskPath。

### Stage attempt 与人工确认

阶段失败、`revise_required`、暂停和取消都写新的 attempt，不覆盖历史。成功 attempt 只有经
人确认后才能生成 immutable `accepted.json`。下一阶段只读取前一阶段 accepted。

accepted 必须记录 attempt 引用、完整性 hash、`human_confirmation_ref` 与确认时间。完整性
hash 失败时不得 accept；测试/review 等质量事实 hash 可记 `unknown`，由人决定接受或重跑。

stage 已 accepted 后禁止继续写该 stage。需要回退时创建新 task，通过允许的只读 input
继承设计产物，不修改历史。

### Worktree 与 spec

make-decision accepted result 是 worktree 唯一权威来源：

```json
{
  "facts": {
    "worktree_root": "/absolute/PaperBuilder-worktree",
    "baseline_commit": "..."
  }
}
```

当前 task 的所有设计/交接 artifact，不限文件名，唯一工作路径命名空间固定为：

```text
<worktree_root>/specs/${task}/...
```

例如 stage 使用的相对文件名为 `spec.md`、`plan.md`、`tasks.md`。`${task}` 必须来自当前
TaskHandle 的 manifest `task_id`，不是示例常量、issue ID 或调用方字符串。

`worktree_root` 只能从当前 task 的 make-decision accepted result 取得。不得从 cwd、当前 Git
root、target repo 或目录搜索重算。

唯一派生 API 是独立受控值对象：

```text
ArtifactDir.open(worktreeRoot, taskId)
ArtifactDir.path(relativeName)
ArtifactDir.read(relativeName)
ArtifactDir.writeAtomic(relativeName, data)
```

`ArtifactDir.root` 内部等于 `<real-worktree>/specs/${task}`。它拒绝绝对路径、`..` 和 symlink
逃逸。stage/skill 文档禁止出现可执行路径拼接；只能使用
`ctx.artifacts.path("spec.md")` 等 named relative artifact。checkpoint 也只接收当前 stage
声明的 named artifact，不接受任意绝对路径。

build-spec 写 `spec.md`；build-plan 读 `spec.md`、写 `plan.md/tasks.md`；build-code 和
verify-code 读取这些 named artifact。活 worktree 文件方便持续更新，但 stage accepted
不能只引用活路径。

build-spec 与 build-plan 在人工接受时必须生成 Git checkpoint：

1. 冻结本阶段 artifact 路径、content hash 与预期 tree；
2. 人工确认绑定 checkpoint plan hash；
3. 使用受控临时 index，只 stage 当前 `produced_artifacts[]`；diff 中出现其他文件立即失败；
4. 在任务 worktree 分支创建明确的 design checkpoint commit；
5. 原子 create-only 创建不可变 ref：
   `refs/workflowhub/checkpoints/<project>/<task>/<stage>` → exact commit；同名 ref 已指向不同
   OID 时 fail-loud；
6. accepted 记录 ref、commit OID、tree OID、每个 artifact blob OID/content hash 和相对路径；
7. consumer 先校验当前 worktree 文件是否匹配 accepted blob；需要历史或跨 task 时使用
   `git show <commit>:<path>`，不依赖 source worktree 仍存在。

checkpoint commit 是阶段边界事实，不是质量 pass；测试/review 可以失败并由人决定是否接受。
checkpoint 创建失败或 blob/hash 不一致时不得生成 accepted。

accepted 只冻结该 stage 声明的 `produced_artifacts[]`：build-spec 拥有 `spec.md`；build-plan
拥有 `plan.md/tasks.md`。后续 stage 不得修改不属于自己的 artifact；若要改变已 accepted
的 spec/plan，必须创建新 task。consumer 只校验自己实际消费的 producer blob。

taskPath 内不复制 canonical spec/plan/tasks。唯一工作副本/路径权威位于 worktree；Git
object 是 accepted 的不可变恢复证据，review packet snapshot 只是 evidence，二者都不是
第二个可编辑工作副本。

### 各阶段只知道什么

- **make-decision**：知道 identity 与 manifest 的 target repo；不知道 storageRoot 派生规则，
  不能访问 ArtifactDir；产出 worktreeRoot/baseline。
- **build-spec**：知道 TaskHandle、decision accepted、Workspace、ArtifactDir；只写
  `spec.md`；不知道环境变量与 taskPath 拼法。
- **build-plan**：知道 build-spec accepted 与 ArtifactDir；读 `spec.md`，写
  `plan.md/tasks.md`；不解析 source task。
- **build-code**：知道 Workspace、ArtifactDir、build-plan accepted/显式 input；代码命令只
  在 Workspace.worktreeRoot 运行；不从 cwd 判断 repo。
- **verify-code**：知道 Workspace、ArtifactDir、build-code accepted；fresh test command 只
  从 accepted facts 读取；不 bootstrap root。
- **journal/review/route/report/metrics**：默认只知道 TaskHandle；确需 artifact 时由父
  StageContext 显式提供 ArtifactDir。
- **close**：知道 TaskHandle、Workspace、ArtifactDir、accepted chain 和 operation plan；
  不知道全局 root 派生规则。

所有 workflow `SKILL.md` 开头必须统一声明：输入 StageContext、允许的 named artifact、读取
的 accepted、写入的 attempt/artifact，以及禁止 env/cwd/remote/path concatenation。

checkpoint ref 永久保护 commit 可达，允许 source worktree/branch 后续
变化。完整五阶段 task close 时仍应使用保留 ancestry 的 merge/fast-forward 策略，使所有
checkpoint 进入最终 ref；但 phase-only 设计 task 不要求补跑 build-code/verify-code 才能被
消费。首版不提供 checkpoint ref 删除/GC，避免引入反向引用索引。
cleanup 前必须验证 ref 精确指向 accepted commit，tree/blob/content hash 匹配。验证失败属于
canonical provenance 完整性错误，不得 cleanup，不能通过“用户确认丢失”绕过。

### 跨 Task

普通五阶段都在同一 task 内，没有 upstream task ID。真正跨 task 只允许读取 source 已
accepted 的阶段；包含设计 artifact 的 slot 还必须受不可变 checkpoint ref 保护。创建时只
能声明三个
固定只读 input：

- `decision` → source `make-decision/accepted.json`；
- `spec` → source `build-spec/accepted.json` 记录的 immutable Git blob；
- `build_plan` → source `build-plan/accepted.json` 记录的 immutable Git blobs。

input 必须是绝对 accepted 路径，严格匹配：

```text
<source-task>/results/<stage>/accepted.json
```

Task 模块按固定三级父目录打开 source `task.json`，先校验 project/task/stage、accepted
引用的 attempt 与完整性 hash。`decision` slot 到此为止，只读取 accepted 的 decision/scope
facts，不要求 Git checkpoint。

`spec` / `build_plan` slot 还必须校验 checkpoint ref 精确指向 accepted commit、tree/blob
OID 与 content hash。source artifact 通过 `git show <commit>:<path>` 读取，不依赖 source
worktree。Git 命令只能通过受控 Git API，以 source `task.json.target_repo_root` 为仓库执行；
调用方不能提供任意 repo cwd。
source 永远只读。

禁止跨 task 传递 build-code、verify-code 或未提交 Git tree；禁止 alias、搜索、latest、
branch/worktree 猜测和文件复制。同一输入同时存在当前 accepted 与 manifest input 时失败。

### Worktree 生命周期与 close

一个 task 至多一个 active worktree。需要换 worktree时，先经人确认形成可验证 Git commit，
结束旧 task，再创建新 task；不做 ownership handoff 状态机。

WorktreeManager 只处理 Git create/validate/remove；Task 模块不承担 Git 操作。

close 使用 append-only operation：冻结带 hash 的 operation plan，人工确认绑定 plan hash；
每一步先探测 Git 物理事实，再幂等执行 commit/archive/push/branch/worktree 操作。崩溃后按
物理事实 reconcile，不重复不可逆操作；完成后写 immutable `completed.json`。

### 迁移与 cutover

不保留长期 runtime adapter。提供 one-shot migration，把旧 task 整体校验后转换成新
`task.json + results attempts/accepted`，不修改旧源，无法证明同一来源时失败。

cutover sentinel `~/.workflowhub/runtime-mode` 不是裸字符串，而是原子写入：

```json
{
  "schema_version": "task-v1",
  "mode": "legacy|quiescing|task-v1",
  "storage_root": "/Users/Hugh/Hugh/Knowledge",
  "cutover_epoch": "..."
}
```

新 runtime 每次启动都按“环境覆盖 → XDG 全局配置 → `os.homedir()`”解析为
`storageRoot`，并要求与 sentinel 完全一致；不一致立即失败且不得创建目录。明显形如
`.../Projects/<project>/tasks` 的旧值也必须明确报 `legacy WORKFLOWHUB_TASK_DIR semantics`。

cutover：

1. 先发布 bridge，让旧 runtime 检查 `~/.workflowhub/runtime-mode`；
2. mode=`quiescing` 后拒绝所有 legacy 新写入并等待在途 writer 结束；
3. 在静止快照迁移；
4. 原子切换 launcher、storage_root 与 mode=`task-v1`；
5. 新 runtime 拒绝旧布局，旧 root 只读归档；
6. 删除旧 parser、旧旁路和旧语义代码。

特别注意：`WORKFLOWHUB_TASK_DIR` 新旧含义不同。bridge 必须根据 runtime mode 只允许一种
解释；不存在同时兼容两种含义的 fallback。

合法修改全局 storage root 必须使用 `workflowhub config rebind-root`：先进入 quiescing，
人工确认，验证目标为空或已完成 one-shot migration，再原子更新 sentinel storage_root 与
环境部署。直接修改环境变量只会得到 root mismatch，不能静默创建第二棵任务树。

## 验收

1. 配置 root 后，PaperBuilder task 必须稳定得到示例路径；旧 project tasks root 被当作
   环境值时必须在创建目录前失败。
2. 未配置时稳定使用 `os.homedir()`，不读取 cwd/remote；全局配置只有 XDG config 一个来源。
3. 同 project/task 从业务根、嵌套 workflowhub、`/tmp` 执行，taskPath 完全一致。
4. project/task/manifest 不一致、路径逃逸、repo basename 冲突真实失败。
5. 五阶段及 journal/review/route/report/metrics/close 全部使用同一 Task handle。
6. `ZHI-138` 只改变 metadata，不改变 taskPath/worktree/artifact 路径。
7. spec/plan/tasks 的唯一可编辑工作路径位于 make-decision worktree 的固定 specs 目录；
   accepted 强制记录
   可达 checkpoint commit/tree/blob，cwd 中同名文件不得被读取。
8. stage attempt 可重跑、不覆盖；accepted 后禁止改写；每阶段推进有人确认。
9. cross-task input 固定、只读；source 身份或 Git checkpoint/blob/hash 不一致真实失败，
   source worktree 删除后仍能读取 accepted artifact。
   `decision` 不需要 checkpoint ref，但伪造 accepted/attempt/hash 必须失败。
10. close 在每个不可逆步骤后崩溃，重跑不重复 commit/push/delete；checkpoint ancestry 不可达
    时拒绝 cleanup。
11. bridge/quiesce/cutover 故障注入证明没有新旧 split-write。
12. 静态守卫覆盖 `workflows/**`、runtime-consumed `skills/**/SKILL.md`、workflow templates、
    scripts、review CLI、journal/metrics/receipt helpers 和测试 fixture；除 bootstrap/Task/
    ArtifactDir 与明确 fixture 外，旧 parser、`WORKFLOWHUB_TASK_DIR`、cwd/remote 身份推断、
    `taskDir/taskId` writer API、裸 `Projects/tasks/specs` 路径为零引用。
13. 五个 stage 分别从业务根、嵌套工具仓和 `/tmp` 启动，并在 cwd 放同名诱饵文件；stage、
    component、journal、review、route、report、metrics、close 均只能命中 TaskContext。

## 删除项

- `run_dir` / opaque run ID / `runs/`；
- cwd/Git remote 身份推断；
- current/upstream 双 resolver 与 alias；
- artifact locator 协议；
- worktree handoff journal；
- 独立 `worktree.json`；
- journal/review/route/close 自行解析路径；
- 永久 runtime adapter、双写和双读；
- branch/commit 中硬编码 workflowhub。

## 宪法对照

- F1/F2：路径规则集中在窄 Task 模块。
- F3/Q1：质量事实只记录；accepted 完整性属于入口边界。
- F6：执行记录集中 taskPath；设计产物以 Git checkpoint 为可恢复权威。
- F7：阶段推进与不可逆操作均人工确认。
- F8：删除 run/upstream/locator/handoff/永久 adapter。
- F9：无显式 project/task 或身份冲突真实失败，不猜测。
- F10：不建数据库、registry 或强制 artifact hash gate。
- Q2：身份/完整性是入口校验，质量判断不自动阻断。
- Q3：实现完成后必须异源审查。
- S8：stage 不依赖宿主 cwd、remote 或工具仓位置。

## 后果

- 用户在 XDG 全局配置中设置 `task_dir`，也可用环境变量临时覆盖；配置不存在时使用本机用户目录。
- 保留熟悉的 `Projects/<repo>/tasks/<task>` 目录，减少迁移和认知成本。
- spec/plan/tasks 随业务 Git 历史追踪，但 worktree cleanup 前必须确认已提交。
- `WORKFLOWHUB_TASK_DIR` 发生 breaking 语义变化，需要原子 cutover。
- 真正防复发的约束仍是：入口一次派生、后续只传 Task handle、绝不从 cwd/remote 猜身份。
