# ADR 0004 — Minimal Run Model

**状态**：已被 ADR 0005 取代（2026-07-16）
**取代**：ADR 0003

## 背景

WorkflowHub 把当前 `cwd` 的 Git remote、业务项目、外部 issue ID、workflow task ID、
上游 task、worktree 和 artifact 路径混成一套隐式解析。外部项目内嵌 workflowhub 工具仓
时，五阶段会稳定把业务项目误判为 workflowhub；journal、review、route、close 等旁路还会
各自重新解析，导致同一 run 的记录可能分裂到不同项目。

真实复现、全链路调研和三方盲审材料见：

- `docs/research/workflow-path-architecture-blind-review.md`
- `docs/research/reviews/workflow-path-opencode.json`
- `docs/research/reviews/workflow-path-kimi.json`
- `docs/research/reviews/workflow-path-claude-code.json`

OpenCode verdict 为 `replace`；Kimi、Claude Code 为 `major_simplification`。三者独立收敛
到同一方向：以一个显式绝对 `run_dir` 取代项目/task/upstream 多重路径解析。

ADR 0003 对根因判断正确，但 current/upstream 双 resolver、artifact locator、worktree
handoff journal、stage-result v2 路径协议会增加新的同步状态与失败面，因此不实施。

## 决策

### 只保留四个概念

1. **Run**：一次完整的 make-decision → verify-code 流程。
2. **run_dir**：Run 唯一、绝对、生命周期内不变的定位锚。
3. **run.json**：Run 的不可变身份和输入 manifest。
4. **stage attempt / acceptance**：阶段尝试与人工边界确认均为 append-only 事实。

外部 issue ID 只是 metadata，不是目录身份。worktree 是执行资源，不是 Run 身份。`cwd`
只用于运行 shell 命令，永不参与业务身份或路径解析。

### 固定布局

创建时可按知识库习惯放置，但运行期不再解析 project 名：

```text
Projects/<project>/runs/<run-id>/
  run.json
  results/
    make-decision/attempt-0001.json
    make-decision/accepted.json
    build-spec/attempt-0001.json
    build-spec/accepted.json
    build-plan/...
    build-code/...
    verify-code/...
  artifacts/
    spec.md
    plan.md
    tasks.md
    research.md
  journal.jsonl
  reviews/
  evidence/
  operations/close/
  .lock
```

所有 canonical workflow artifact 与执行记录都在 `run_dir`。业务仓内如需保存 spec、plan、
tasks，只能经过显式 export/commit；业务仓副本不是 workflow 权威源。

### run.json

最小 schema：

```json
{
  "schema_version": "1.0.0",
  "run_id": "opaque-immutable-id",
  "created_at": "2026-07-15T00:00:00Z",
  "target_repo_root": "/absolute/path/to/business-repo",
  "issue_ids": ["ZHI-138"],
  "inputs": {
    "build_plan": "/absolute/source-run/results/build-plan/accepted.json"
  }
}
```

`run.json` 创建后不可变。禁止放入高频可变的 `status`、`stage_results`、`updated_at`、lock
或重复的 worktree 生命周期状态。运行状态由已发布 result 与 journal 事实推导。

`inputs` 仅用于真正跨 Run 复用，在创建 Run 时显式绑定语义槽到绝对 source result。
source 永远只读。普通五阶段同 Run 流程不需要 upstream 概念。

### 唯一入口

创建 Run：

```bash
workflowhub run create \
  --runs-root /absolute/KnowledgeDigest/runs \
  --repo /absolute/KnowledgeDigest \
  --issue ZHI-138 \
  --input build_plan=/absolute/source-run/results/build-plan/accepted.json
```

执行 stage：

```bash
workflowhub verify-code --run-dir /absolute/path/to/run
```

只允许两个等价通道：CLI `--run-dir` 和 `WORKFLOWHUB_RUN_DIR`。优先级为 CLI > env；两者
同时存在但不同，立即失败。两者都没有，也立即失败。

stage 运行期禁止使用以下信息推断身份：

- `process.cwd()`；
- Git remote；
- `WORKFLOWHUB_TASK_DIR`、`WORKFLOWHUB_PROJECT_KEY`；
- `~/.workflowhub/config.json.task_dir`；
- branch、worktree 名、issue ID 或目录搜索。

config 只允许 launcher 在创建 run_dir 时选择默认 `runs-root`；创建完成后不再进入 stage。

### Run 模块

新增唯一 Deep Module。最小 API：

```text
openRun(absoluteRunDir)
readInput(slot)
readAccepted(stage)
artifact(name)
publishAttempt(stage, data)
acceptAttempt(stage, attemptRef, acceptance)
appendJournal(event)
reviewDir()
lock() / unlock()
```

`openRun()` 返回受控 handle。所有路径常量、realpath/逃逸校验、原子写和 append-only 规则
只存在于 Run 模块。五阶段、journal、review、route、report、metrics、close 必须接收该
handle；不得接收 task ID/root 后自行拼路径或调用 parser。

`.lock` 是临时 advisory lock，不是审计状态。进程退出后可检测 stale；并发写入同 Run
必须失败。`publishAttempt()` 在锁内分配下一序号并原子写，永不覆盖旧 attempt。

阶段失败、`revise_required`、人工暂停和取消都必须发布 attempt，之后可重跑并产生新
attempt。`accepted.json` 是 canonical 边界记录，包含被接受 attempt 的相对引用、hash 与
acceptance。make-decision、build-plan、verify-code 的 acceptance 必须引用人工确认；
build-spec、build-code 由固定 stage policy 自动接受。下一阶段只读取前一阶段的
`accepted.json`。质量事实失败必须原样浮现，不能改写成 pass，也不能阻止自动 stage
写 accepted。

唯一例外是已接受 build-code 被已认证的 verify-code 失败受控重开：runtime 先把旧
canonical bytes 追加归档为 `accepted-attempt-<n>.json`，再原子替换 canonical
`accepted.json`。读取协议仍只认 canonical 文件；归档和 reopen provenance 只用于完整
lineage，不是下游旁路输入。

accepted 引用 attempt 的完整性 hash 属于边界完整性，必须成功计算和校验；失败则不能
创建 accepted。它不同于测试、review、artifact 等质量事实采集 hash，后者失败可记
`unknown`；人工 gate 据此判断，自动 stage 则原样携带到下个人工 gate。

某 stage 已有 `accepted.json` 后，Run API 拒绝该 stage 的新 attempt 和再次 accept。下游
若发现必须回退，结束当前 Run 并创建新 Run；只可通过下述允许的设计 input 继承已接受
材料，不可改写历史 accepted。

### Stage attempt 与三个关键边界

每份 attempt 只增加最小防串线 stamp：

```json
{
  "schema_version": "1.0.0",
  "run_id": "opaque-immutable-id",
  "stage": "build-code",
  "attempt": 1,
  "outcome": "success|failed|cancelled|revise_required",
  "facts": {}
}
```

读取 attempt/accepted 时校验 `run_id`、`stage`、attempt 引用与 source `run.json`。阶段策略
固定为：make-decision、build-plan、verify-code 经人工确认后写 `accepted.json`；build-spec、
build-code 发布 attempt 后由受控 runtime 自动写 `accepted.json`。人工确认是 F7 关键业务
边界，不是质量 gate；自动接受也不能把测试、review、hash 等事实改写成 pass。所有事实按
F3/Q1 记录并在下一个人工边界浮现。

不建立通用 artifact locator、全量
producer identity 协议或强制 hash gate。hash 可作为 journal 事实采集；采集失败记
`unknown`，不阻断质量推进。

### 五阶段

- **run create**：建立唯一身份边界，验证 target repo；不读取当前 remote 猜项目。
- **make-decision**：从 manifest 读取 target repo；创建或选择 worktree；将绝对
  `worktree_root` 和 baseline commit 写入 make-decision result。
- **build-spec/build-plan/build-code/verify-code**：默认从同 Run 固定前序 accepted 读取；
  worktree 只从 make-decision result 读取；canonical artifact 写 `artifacts/`。
- **verify/close**：只读同 Run 的 result、artifact、evidence；不再 bootstrap task root。

journal、review、route、report、metrics 与 close 全部使用同一 Run handle。review flow 若
只是当前 stage 的子流程，写 `reviews/`；只有确实独立的 workflow 才创建新 Run。

### 跨 Run

同 Run 没有 upstream ID。首版跨 Run input 固定为下表，不接受其他名称：

| slot | source stage | 必需 source artifact |
|---|---|---|
| `decision` | `make-decision` | `accepted.json` 中的 decision/scope facts |
| `spec` | `build-spec` | `artifacts/spec.md` |
| `build_plan` | `build-plan` | `artifacts/plan.md`、`artifacts/tasks.md` |

禁止把 `build-code`、`verify-code` 或任何未提交 Git tree 当作跨 Run input。同一 stage 所需
输入若同时存在当前 Run 前序 accepted 与 manifest input，入口必须报冲突；调用方创建 Run
时只能选择一种来源，不能静默规定优先级。

每个 input 必须严格指向：

```text
<source-run-dir>/results/<declared-stage>/accepted.json
```

解析先按完整结构匹配路径；从 `accepted.json` 依次取三级父目录
（`<stage>` → `results` → `<source-run-dir>`）得到 source run_dir，禁止向上搜索。随后：

1. realpath 必须存在且是普通文件；
2. 通过固定布局打开 source Run handle；
3. 校验 accepted、attempt 的 `run_id`、`stage` 和所需 facts；
4. source 只读，所有输出仍写当前 Run；
5. 禁止 alias、搜索、latest、branch/worktree 名猜测和文件复制。

source artifact 必须通过 source Run handle 的固定 `artifacts/` 路径读取；旧相对 ref 只由
one-shot migration 解释，新 runtime 不把它相对当前 Run 或 cwd 解析。

未提交代码状态不得跨 Run。需要换 worktree 时，先经人工确认把旧 Run 代码形成可验证的
commit/bundle 并结束旧 Run，再以该 immutable baseline 创建新 Run；首版不把 commit/bundle
作为普通 input slot，也不实现 worktree ownership handoff 状态机。

### Worktree 生命周期

WorktreeManager 与 Run 分责：前者只负责 Git worktree 创建、验证和删除；Run 只记录并
消费 make-decision result 中的资源事实。

一个 Run 至多一个 active worktree。close 前重新验证 worktree、同仓与 baseline。
三个关键 stage gate 以及 commit、push、merge、archive、cleanup 等不可逆操作必须人工
确认；build-spec/build-code 自动推进。stage acceptance 写 accepted，close 授权写独立
operation 记录，两者不得复用。
branch/commit 文案不得写死
`workflowhub`；命名策略是 launcher/项目配置，不参与路径身份。

close 是独立 append-only operation，不挤进 verify-code accepted：

```text
operations/close/attempt-0001.json
operations/close/events.jsonl
operations/close/completed.json
```

开始前冻结 operation plan（commit/archive/push/branch/worktree 动作、目标、前置 Git facts）并
计算 hash；人工确认必须绑定该 plan hash。执行器对每一步遵循“先探测物理事实，再决定是否
执行”：目标 commit 已存在则校验 tree/message 后跳过；目标 push 已到达则校验 remote ref
后跳过；branch/worktree 已删除则校验不存在后跳过。每次探测与动作结果追加 event。

崩溃恢复重新读取同一 plan 和 Git 物理事实进行 reconcile，不依赖“上次准备做到哪”的可变
状态，也不重复 commit、push 或 delete。全部步骤满足后原子写 immutable `completed.json`；
不同 plan hash 不得复用同一 attempt。失败可追加新 attempt，但任何新的不可逆 plan 都要
重新人工确认。这样保留 Let it crash，同时不引入 worktree ownership handoff 状态机。

### Issue 可发现性

`issue_ids[]` 只用于查询：

```bash
workflowhub run find --issue ZHI-138
```

首版直接扫描 `runs-root` 下的 manifest。没有真实性能问题前不建立数据库或索引；索引即使
以后增加，也只是可重建的查询缓存，不能成为路径权威。

## 删除项

最终删除：

- cwd/Git remote 项目推断；
- stage 内 task-dir/project/config fallback；
- `task_tracking_root` 作为运行期身份模型；
- current/upstream 双 resolver；
- upstream task alias；
- artifact locator 协议；
- worktree ownership handoff journal；
- 独立 `worktree.json`；
- cwd 相对 `specs/{task-id}`、`tasks/{task-id}`；
- journal/review/route/close 自行解析路径；
- branch/commit 中硬编码 `workflowhub`；
- 无 provenance 的多路径 legacy migration；
- 长期 runtime adapter、双写或双读模式。

## 迁移

不保留长期 runtime adapter。提供 one-shot：

```bash
workflowhub migrate-task \
  --task-dir /absolute/legacy/task-dir \
  --runs-root /absolute/new/runs-root
```

迁移器只读旧目录，整体校验一个 task 的 worktree、result、artifact 与 issue metadata，创建
新 Run 并生成迁移报告；不修改、删除或补造旧数据。无法证明同一来源时失败。

cutover 采用显式 quiesce 协议，不依赖“大家不要再跑旧版”：

1. 先发布 bridge 版 legacy launcher；它在每次启动和写入前检查全局
   `~/.workflowhub/runtime-mode`，值为 `quiescing` 或 `run-v1` 时拒绝 legacy 写入。
2. 确认所有受支持入口已升级到 bridge 版，盘点并停止旧 stage/provider 进程；无法确认的
   主机不进入迁移。
3. 原子把 mode 从 `legacy` 改为 `quiescing`，禁止新 legacy run，等待在途 writer 退出。
4. 在静止快照上执行 one-shot migration；迁移报告记录 source hash 和 cutover epoch。
5. 原子切换 launcher/symlink 与 mode=`run-v1`；新 runtime 拒绝旧 task env/layout，bridge
   legacy runtime 继续拒写。
6. 将 legacy roots 设为只读归档。人工直接运行未受支持的古老 binary 不属于受支持入口，
   cutover 文档必须要求移除其 executable/alias。

发布顺序：

1. 本 ADR、Run schema、Run kernel 与真实嵌套仓回归；
2. run create、WorktreeManager、make-decision；
3. 同一发布切片迁移其余四 stage 和所有 journal/review/route/report/close writer；
4. 外部项目端到端、故障注入和独立审查；
5. 部署 bridge、quiesce 后 one-shot migration 处理在途任务；
6. 原子 cutover 后删除 parser、旧 env、旧 worktree.json、旁路和 runtime adapter；
7. 旧目录只读保留到明确期限，再经人工确认归档。

开发可分步，生产不可半套上线。没有 quiesce 证据与 cutover epoch 时禁止宣称迁移完成。

## 验收

1. 同一 `run_dir` 从业务根、嵌套 workflowhub、任意 `/tmp` cwd 执行，所有路径完全一致。
2. 缺 run_dir、相对 run_dir、CLI/env 冲突在任何 Step 前失败。
3. `ZHI-138` 添加或变更只影响 metadata，不改变 run_dir/worktree/result 路径。
4. 五阶段真实串行；下一阶段只读取人工接受的 attempt；失败/revise 后可追加重跑，旧事实
   不被覆盖。
5. journal/review/route/report/metrics/close 全部写入同 Run。
6. cross-run input 只读且仅允许固定设计 slot；source run/stage 身份错配、固定布局不符、
   当前/input 双来源冲突、未提交代码输入或路径逃逸真实失败。
7. publish overwrite、并发锁、stale lock 有确定行为。
8. worktree 缺失、非同仓、baseline 漂移在入口明确失败。
9. bridge → quiesce → migration → cutover 故障注入证明无 legacy/new split-write；迁移生成
   报告且不修改旧源。
10. 静态守卫证明 stage/sidecar 中旧 parser、`process.cwd()`/Git remote 身份推断、裸
    `specs/tasks` 路径为零引用。
11. 删除 remote/config/path parser 后，上述端到端仍通过。
12. close 分别在 commit、archive、push、branch delete、worktree delete 后崩溃；重跑通过
    物理事实 reconcile，只产生一个目标 commit/push，最终写唯一 completion。

## 宪法对照

- F1/F2：路径复杂度集中在单一窄 Run module；stage 不理解路径规则。
- F6：所有执行记录与 artifact 共置一个 Run。
- F7：方向、计划、最终验证三个 stage gate 人工确认；可逆中间阶段自动推进；close 不可逆动作独立授权并留痕。
- F8：删除 resolver、alias、locator、handoff 和永久 adapter。
- F9：缺显式 run_dir 与身份错配真实失败，不搜索、不假绿。
- F10：首版不建 registry、数据库或 hash gate。
- Q1/Q2：身份输入错误在入口失败；质量事实只记录，不阻断。
- Q3：实现完成后必须由独立来源按真实端到端证据审查。
- S8：阶段不依赖宿主 cwd、remote 或工具仓位置，可跨项目搬运。

## 后果

- 用户必须在创建 Run 时明确业务 repo；之后只需携带一个 `run_dir`。
- issue 改名、工具仓嵌套、remote 变化不再影响流程身份。
- spec/plan/tasks 默认成为外置 workflow artifact；入业务仓需显式 export。
- 迁移是 breaking cutover，不用永久兼容换取短期便利。
- Run module 成为关键边界，必须保持窄接口，不能演化成 Git、审查或业务裁决的 God object。
