# ADR 0003 — 显式任务根与上游血缘

**状态**：已被 ADR 0004 取代（2026-07-15）

## 背景

workflowhub 在外部项目中执行阶段时，存在两类被混用的身份：

1. 当前命令所在 Git 仓库，不一定是任务记录所属业务项目。嵌套在
   `KnowledgeDigest/workflowhub` 中执行时，按 `cwd` 的 origin remote 会把项目误判为
   `workflowhub`，进而读写错误的任务根。
2. 当前执行任务 ID 不一定是上游工作流任务 ID。`ZHI-138` 是当前 issue/执行身份，
   `kd-phase0-digest-spec` 是真实上游血缘；现有 build-code 用一个 `task_id` 同时定位
   当前输出和上游输入，导致真实 `stage-result`、`decision-log` 与 spec 无法读取。

这不是 worktree 丢失，也不是产物缺失。根因是隐式项目推断与单一任务身份无法表达
真实调用关系。

## 决策

### 一个任务根权威源

对外继续使用唯一环境变量 `WORKFLOWHUB_TASK_DIR`；契约内统一称
`task_tracking_root`。不新增 `WORKFLOWHUB_TASK_TRACKING_ROOT` 别名，避免两个环境变量
长期成为竞争权威源。

解析优先级固定为：

1. API/阶段输入显式 `task_tracking_root`；
2. `WORKFLOWHUB_TASK_DIR`；
3. `~/.workflowhub/config.json.task_dir`；
4. 旧版 config + project key/remote 推导。

五阶段调用方必须显式传 `task_tracking_root`。旧版 remote 推导暂时保留兼容，但使用时
输出迁移告警；不得把它作为新流程的正常路径。

如果检测到未支持的 `WORKFLOWHUB_TASK_TRACKING_ROOT`，入口必须明确报错并提示改用
`WORKFLOWHUB_TASK_DIR`，不能像现在一样静默忽略。

显式任务根必须是已存在的 `tasks` 目录。当前 task 子目录可由阶段首次写入时创建；
tracking root 本身缺失、不是目录或无法访问时，入口失败。

### 当前任务与上游血缘分离

build-code 输入增加显式上游描述符：

```yaml
task_id: ZHI-138
task_tracking_root: /Users/Hugh/Hugh/Knowledge/Projects/KnowledgeDigest/tasks
worktree_root: /absolute/path/to/actual/build-code-worktree
upstream:
  task_id: kd-phase0-digest-spec
  stage: build-plan
  review_flow_id: null
```

约束：

- `task_id` 是当前写入身份。
- `upstream` 是只读血缘。
- `upstream.stage` 只允许 `build-plan` 或 `make-decision`。
- `make-decision` 必须提供 `review_flow_id`；禁止猜“最新” review flow。
- 首版不做 alias resolver，不根据 branch、worktree 名或目录搜索猜映射。
- 不把血缘塞入 `worktree.json`；该文件只描述 worktree 生命周期。

解析必须形成两套独立路径：

```js
const current = resolveTaskRecordPaths(taskId, { taskTrackingRoot });
const source = resolveTaskRecordPaths(upstream.task_id, { taskTrackingRoot });
```

所有 build-code 结果、evidence、reviews 与 journal 只写 `current`。上游
`stage-result`、`decision-log`、plan、tasks 与 spec 只从 `source` 读取。禁止把上游文件
复制到当前任务目录。

### 上游引用规则

`build-plan` 路径读取 `source.stage_result.build_plan`。新版 plan、tasks 与 spec 必须来自
该 stage-result 中的显式 locator，例如：

```json
{
  "facts": {
    "artifact_base": {"kind": "producer_worktree", "root": "/absolute/source/worktree"},
    "plan_ref": {"base": "artifact_base", "path": "specs/kd/plan.md"},
    "tasks_ref": {"base": "artifact_base", "path": "specs/kd/tasks.md"},
    "spec_ref": {"base": "artifact_base", "path": "specs/kd/spec.md"}
  }
}
```

locator 首版只允许 `base=artifact_base`；`path` 必须是无路径穿越的相对路径。
`artifact_base.root` 是 producer 运行时已验证的 source worktree，不能替换成 consumer
当前 worktree。consumer 校验它与 source `worktree.json` 中的 `worktree_root` 一致，并
记录该 source worktree 记录的 hash；随后校验解析结果仍在 producer 根内、存在且是普通
文件。不再拼接 `specs/{current-task-id}`，也不扫描目录寻找候选文件。

build-spec v2 必须产出 `artifact_base` 与 `spec_ref` locator；build-plan v2 必须读取并
原样继承该 `spec_ref`，
同时把原有相对 `plan_ref`、`tasks_ref` 升级为 locator。facts contract v2 将 build-plan
必填项改为 `artifact_base`、`plan_ref`、`tasks`、`tasks_ref`、`spec_ref`。producer、
schema 与 consumer 必须在同一迁移切片发布，避免半升级。

`make-decision` 路径通过
`resolveMakeDecisionStageResultPath(upstream.task_id, upstream.review_flow_id,
{ taskTrackingRoot })` 解析。
缺少 `review_flow_id` 直接失败。

### 当前任务的 worktree 所有权

build-code 继续只接受当前 task 自己的 `worktree.json`，且输入 `worktree_root` 必须与其
一致。不得借用或复制上游 task 的 `worktree.json`。

issue ID 与 make-decision task ID 不同时，负责 issue/task handoff 的编排边界必须在
build-code 前执行一次人工确认的所有权转移。转移完成态固定为：

```text
source worktree.json: status=handed_off, handed_off_to_task_id=ZHI-138
current worktree.json: status=active, created_by_stage=task-handoff,
                       source_task_id=kd-phase0-digest-spec
```

worktree 合同增加 `status=handed_off`、`created_by_stage=task-handoff`：source 进入
`handed_off` 后禁止重入、commit、cleanup 和 close；只有 current 是 commit、cleanup、
close 的权威。verify-code cleanup current 后，source 保持 `handed_off` 并通过
`handed_off_to_task_id` 指向最终生命周期记录，不能再次显示 active。

handoff 必须校验目标 worktree 已注册、同仓、分支一致，并校验 source 当前为 active、
current 尚无 active 所有权。journal 固定写入
`{task_tracking_root}/.handoffs/{source-task-id}--{current-task-id}.json`；transfer id 由
source/current task ID 与 source worktree record hash 确定，同一输入重复调用必须幂等，
不同输入占用同一路径必须失败。操作先写 handoff journal（prepared），
再更新 source 和 current，最后标 committed；每步使用同文件系统原子 rename。失败恢复只
根据 journal 补完或回滚，任何 `prepared`/两侧不一致状态都禁止 build-code。人工确认引用
写入 journal，满足 F7。

handoff 只转移既有 worktree 的单一生命周期权，不复制上游产物、不创建第二个 worktree。
缺少 committed handoff 或合法当前记录时，build-code 保持 fail-loud。

### Stage-result 身份

新版 producer 必须在统一 stage-result 顶层写入：

```json
{"contract_version":"2.0.0","task_id":"kd-phase0-digest-spec","stage":"build-plan"}
```

v2 validator 将三个字段设为必填，并校验安全 ID 与允许的 stage。cross-task consumer
只接受 v2 上游产物，并核对声明与内容一致。旧 v1 stage-result 只能走下述 same-task
legacy adapter，不能作为 cross-task 上游。

### 可审计血缘

build-code stage-result 写入：

```json
{
  "facts": {
    "lineage": {
      "upstream_task_id": "kd-phase0-digest-spec",
      "upstream_stage": "build-plan",
      "upstream_stage_result_ref": "/absolute/path/stage-result-build-plan.json",
      "upstream_stage_result_hash": "sha256:..."
    }
  }
}
```

路径与 hash 用于回溯。另写 `upstream_stage_result_hash_status` 与可选
`upstream_stage_result_hash_error`；hash 采集失败记录 `unknown`，不作为质量 gate。
verify-code 从 build-code 的 `facts.lineage` 继承血缘，不要求再次人工提供同一映射。

### 兼容与失败语义

旧调用未提供 `upstream` 时，仅允许同 task 兼容，并记录
`lineage_mode: legacy_same_task` 和迁移告警。legacy adapter 只接受现有字段：相对
`plan_ref`/`tasks_ref` 明确定义为基于已验证 `worktree_root`；spec 只接受 build-spec
stage-result 已有的 `facts.spec_ref`，不拼目录、不搜索。缺任何必需引用就失败。旧产物
不会被改写成 v2，也不得用于 cross-task。不得跨 task 猜 alias。

以下属于入口契约错误，执行前失败：

- task tracking root 缺失、非法或不可访问；
- `upstream.task_id` 已提供但 `stage` 缺失或不支持；
- `make-decision` 缺少 `review_flow_id`；
- 上游 task、stage-result、decision-log 或显式引用缺失；
- cross-task 上游不是 v2，或声明的 task/stage 与 stage-result 身份不一致；
- task ID、review flow ID 或引用包含不允许的路径穿越。

错误必须同时打印当前 task、上游 task 与最终解析路径。不得回退当前 task、猜测候选、
复制文件或伪造产物。

历史 stage-result 不立即因缺少 `facts.lineage` 全量失败。第一阶段采用“有则严格校验、
新 producer 必须写入”；契约版本升级后再把 lineage 设为全局 required。

## 实施范围

最小改动：

1. `core/task-dir-parser.mjs`：未支持环境变量明确报错；legacy remote fallback 告警。
2. `core/task-record-paths.mjs`：CLI 支持显式 root；增加只返回 `{current, upstream}` 的
   窄 lineage resolver，不做搜索和 alias。
3. stage invocation payload：把 `task_tracking_root` 定义为所有阶段统一输入，并由调用
   适配层显式传给 resolver；环境变量只供 CLI 兼容，不作为 payload 的替代字段。
4. worktree 合同与 handoff：支持有来源记录的 `task-handoff` 初始化。
5. stage-result contract/validator v2：增加并校验 `contract_version`、`task_id`、`stage`。
6. `workflows/build-code/SKILL.md`：加入输入契约、current/source 读写隔离、lineage 输出。
7. `workflows/verify-code/SKILL.md`：从 build-code 结果继承 lineage。
8. build-spec/build-plan producer 与 facts v2：产出 locator 并传播 `spec_ref`。
9. lineage 首期 optional-validated，新 producer 强制；后续版本再全局 required。
10. 五阶段文档统一显式 `task_tracking_root`。

首版不做：alias registry、跨项目上游 root、自动目录搜索、旧产物批量复制或补造。

## 验收

- 在 `KnowledgeDigest/workflowhub` cwd 下显式传 KnowledgeDigest root，`ZHI-138` 必须解析
  到 `Projects/KnowledgeDigest/tasks/ZHI-138`，结果不得包含 `Projects/workflowhub`。
- `ZHI-138` build-code 可读取 `kd-phase0-digest-spec` 的真实 build-plan stage-result、
  decision-log 与引用文件。
- build-code 只向 `ZHI-138` 写新结果，不在其中复制上游产物。
- `ZHI-138` 必须拥有 committed handoff 与校验通过的当前 `worktree.json`；source 同时
  为指向 ZHI-138 的 `handed_off`。双 active、prepared 或借用上游记录必须失败。
- handoff 分别在 source 更新后、current 更新后中断时，重复调用必须按同一 transfer id
  幂等恢复到唯一 committed 状态。
- cross-task `make-decision` 在缺少 `review_flow_id` 时真实失败；提供后读取指定 flow。
- make-decision resolver 测试断言显式 `{ taskTrackingRoot }` 被传入，禁止回落 cwd。
- cross-task 上游缺 v2 身份字段或 task/stage 不匹配时真实失败。
- locator 必须按 producer `artifact_base` 解析；current 中存在同名文件不得被读取。
- current/source 任一缺失、身份不匹配或路径穿越时真实失败，不出现 fallback 假绿。
- build-code 结果包含 lineage；只有 `hash_status=verified` 可称已验证，`unknown` 只能称
  已记录。verify-code 能据此恢复相同上游。
- 满足 adapter 必需引用的旧 same-task fixture 可迁移运行，并明确标记 legacy；缺少
  `tasks_ref` 或 build-spec `spec_ref` 时必须真实失败。

## 宪法对照

- F1/F2：只增加一个显式 root 与一个窄 upstream 描述符，不引入 registry。
- F6：血缘进入统一 stage-result，可追溯，不复制证据岛。
- F8：首版不做 alias、搜索兜底和跨根读取。
- F9：缺失、冲突和歧义明确失败，不猜、不伪造、不假绿。
- F3/Q1：hash 是事实采集，失败记 unknown，不成为质量阻断门。
- Q2：身份和必需输入属于入口契约校验，可以在执行前失败。
- Q3：实施完成后由独立上下文按本 ADR 与真实回归证据裁决，不自审自判。
- F7：worktree 所有权转移要求人工确认，并保留确认引用。
- S8：显式 root 和 lineage 不依赖宿主 cwd，支持外部项目搬运。

## 后果

- 外部项目执行不再依赖当前 Git remote 猜业务归属。
- issue ID 与工作流 task ID 可以不同，仍保持单一真实上游证据链。
- 调用方多提供一个明确 upstream 描述符；换取确定、可审计、可复现的读取行为。
- 旧调用保留有限 same-task 兼容；跨 task 必须显式迁移。
