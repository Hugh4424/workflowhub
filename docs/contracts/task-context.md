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

新任务必须声明 `execution_mode=per_invocation`，且 `task.json` 不含 `runner_root`、
`runner_oid` 或 `runner_replacement`。Launcher 每次只接受显式绝对 runner root、stage 和
可选 run id；不得从 cwd、target repository、remote 或任务记录猜 runner。

runner 必须是 canonical Git 顶层、符合任务 branch，HEAD 是完整提交，工作树 clean，并含
普通文件形式的 `AGENTS.md`、`CONSTITUTION.md` 和 `workflows/<stage>/SKILL.md`。认证计算
提交与合同内容身份，create-only 写入 `identity/executions/<run>.json` 后才建立
StageContext。任务清单不保存 runner 绝对路径；同一 run/同一 bytes 可幂等 replay，同一 run
不同来源或内容必须冲突。该认证只证明执行来源，不是 Q3 的质量审查。

没有 `execution_mode` 的旧任务一律按 `legacy_pinned` 读取。它可以验证历史 runner 与
replacement lineage，但新正式调用必须先执行一次 `migrateTaskToPerInvocation`。迁移要求
显式 task identity 和调用方已读取的原始 `task.json` SHA-256；同一把任务 manifest lock 内
重读并做 CAS，追加
`identity/migrations/per-invocation/<previous-manifest-hash>.json`，保留历史
`runner_root_migration` 与 replacement records，再原子发布
`execution_mode=per_invocation` 且不含 live runner 绑定的新 manifest。

迁移 replay 仅在 migration record、旧 hash 与当前新 manifest 精确闭合时返回原结果；错误
hash、并发变化、缺失历史或同 ref 不同 bytes 均 fail-loud，且不得部分改写 task.json。

## 同 task 恢复

受信宿主可使用 `scripts/task-recovery.mjs` 的 Phase 恢复入口：

- `phase-pointer`：只接受 `--stage=build-code`，只允许当前 `phase-1` 回到目标 `phase-0`。
  凭证必须绑定当前权威 pointer、旧 Phase 0 canonical evidence 与 matching formal PASS
  review，以及新的 receipts/snapshot。恢复前必须验证这些记录存在、可读、hash/ref 匹配且
  已正式闭合；调用方提供的 Phase、snapshot 或来源状态不能代替这些权威记录。

`phase-pointer` 根据 credential snapshot 与旧 Phase 0 snapshot 的精确关系使用以下矩阵：

| snapshot 关系 | `phase_subject.recovery_intent` | 结果 |
| --- | --- | --- |
| same | 精确等于 `same-snapshot-phase0-reopen` | 允许受控恢复 |
| same | 缺失 | 以 `RECOVERY_PHASE_INTENT_REQUIRED` 拒绝 |
| same 或 changed | 空值、大小写/空白变化、别名或其他值 | 以 `RECOVERY_PHASE_INTENT_MISMATCH` 拒绝 |
| changed | 精确等于 `same-snapshot-phase0-reopen` | 以 `RECOVERY_PHASE_INTENT_USAGE_MISMATCH` 拒绝 |
| changed | 缺失 | 保持既有 changed-snapshot 恢复 |

same-snapshot 成功只追加一条 create-only recovery generation。该 generation 同时是一次性
gate；同一把 `build-code-phase-evidence` lock 内必须重读 gate 和 pointer，并以来源
`phase-result.json` 的原始内容作 CAS 条件。只有 generation、gate 与 pointer 翻转全部成立才
算提交成功；提交前故障必须恢复旧 pointer、移除本次 generation，且不触发 review。replay
返回 `RECOVERY_ALREADY_USED`，并发 pointer 变化返回 `RECOVERY_CONCURRENT_CHANGE`。

提交后当前 `phase-result.json` 为 `phase-0`/`awaiting_review`，并携带 recovery ref/hash。
健康路径立即发布绑定该 recovery 的 canonical Phase evidence；若该 continuation 中断，恢复
仍已提交，返回 `next_entry: stage-runtime publish-phase-evidence` 供同一 recovery 幂等补齐。
新 evidence 必须触发 fresh `wh-review`：新 attempt/result 的材料身份与旧 Phase 0 review
不同；同一新材料重试只能复用该新结果。只有 fresh PASS 才能续走 Phase 1。

恢复 generation 的 `before/after.hash` 是可复现的完整记录哈希：记录中的单向自引用字段
（phase pointer 的 `recovery_hash`）在计算时规范化为空字符串，再由读取方按同一规则重算；这不是循环哈希，
也不允许用占位值或只哈希 runner identity 冒充最终记录。

两条入口只接受 task-local canonical credential ref/hash，不接受 inline JSON；每个 kind
独立消费一次 gate。缺凭证、身份/来源/快照/记录不一致返回稳定 `RECOVERY_*` 错误，失败不
消费 gate。目标 Phase 0 snapshot 未变化返回
`RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`，不改变任何指针或记录。intent 缺失/错值/用途
错误、权威 pointer 或来源失配、闭合不完整、replay、CAS 冲突与持久化失败保持可区分；
任何提交前拒绝均不改变 pointer、gate、历史或 review 调度。

恢复期间禁止手改 `task.json`、`phase-result.json`、accepted、receipt、test 或 review；
不得删除或改写 recovery generation/gate，不得创建新 task、调用 provider 或用 recovery
archive、旧 Phase evidence、旧 review 旁路正式 evidence/review。历史 `runner-replacement`
记录只用于验证旧证据，不得在 `per_invocation` 模式继续追加。

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
