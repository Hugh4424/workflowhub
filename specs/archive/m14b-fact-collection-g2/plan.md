# 实施计划：m14b-fact-collection-g2

**Task ID**: `m14b-fact-collection-g2`  
**基线**: `4310020cfd6e06e818321b2a078c8e6978acf838`  
**输入**: 已接受并独立审查通过的 `specs/m14b-fact-collection-g2/spec.md`  
**状态**: 待人工确认

## 1. 概述

在当前 WorkflowHub 任务内生成四份确定性事实索引：transcript、artifact、流程健康、技能清单。实现只消费认证的 StageContext、TaskHandle canonical records、accepted Workspace、ArtifactDir 正式产物和仓库内已登记配置；不扫描 HOME/cwd/私有缓存，不调用 LLM，不新建全局索引或第二套证据库。

首版生产 registry 没有已登记 transcript source，因此固定输出一条 `missing/no_registered_source`。同时实现规格要求的最小 launcher-issued registry capability：只接受完整登记的 source ID、受控 ref、格式、版本、required 和 reader capability；不接受裸宿主路径，不做目录发现。生产默认传空 registry，测试用登记 capability 端到端覆盖坏行和不支持版本；未来 source 仍须经新规格正式登记后才能进入生产配置。

## 2. 调研结论

`spec-research` 状态：`skipped`。原因：接受规格已冻结产品边界，计划所需不确定性均可由当前仓库合同和基线代码回答，无需外部资料。

已核实复用点：

- `core/stage-context.mjs` 的 `bootstrapStage` 与 branded StageContext；
- `core/task-handle.mjs` 的 `readRecord`、`withRecordLock`、`writeRecordAtomic`；
- `core/workspace.mjs` / `core/git-worktree-snapshot.mjs` 的 Workspace 身份与 snapshot；
- `core/canonical-source.mjs` 的 `canonicalJson`、`contentHash`；
- `metrics/collector.mjs` 的 `createMetricsLauncherConfig`、`configForCollector`、`recordSkeleton`、`updateOwnResult`；
- `core/check-skill-closure.mjs` 与 `core/local-skill-resolver.mjs` 的现有 closure/bundle 能力；
- `specs/m14a-audit-contract-layer/skills-inventory.schema.json` 和 `quality-failure-taxonomy.md`。

## 3. 技术上下文与最小改动面

语言与测试：Node.js ESM、Vitest、已有 `ajv`/`js-yaml` 依赖。无需新增生产依赖。

计划改动：

```text
core/fact-indexes.mjs                  [NEW] 纯投影、校验、排序、去重与冲突合并
core/fact-collector.mjs                [NEW] StageContext 校验、可信来源读取、四文件持久化编排
config/transcript-sources.mjs          [NEW] 生产静态登记；基线为空
scripts/collect-task-facts.mjs         [NEW] 唯一 launcher；创建 StageContext 与 metrics capability
core/task-handle.mjs                   [MODIFY] 增加受控 attempt 枚举能力，并补原子写故障测试注入点
tests/m14b-fact-collection.test.mjs    [NEW] AC-001 至 AC-015 的最小 fixture
```

不新增输出 schema 副本、持久化/生产 transcript source registry、全局数据库、CLI 样本矩阵或 execution evidence 存储；仅增加 launcher-issued 内存 capability。三类 JSONL 合同直接按接受规格的固定字段/枚举验证；skills inventory 运行时和测试均读取并校验 M14a 原 schema，不复制为第二权威。

## 4. 接口与数据合同

### 4.1 Launcher 与采集入口

`scripts/collect-task-facts.mjs` 只接受 `--stage=<canonical-stage> --project=<project> --task=<task>`，不接受 task path、worktree root 或 baseline override。launcher 使用 `loadConfig()`、`bootstrapStage(...)`、`createMetricsLauncherConfig(loadedConfig)`，再调用：

```js
collectTaskFacts(ctx, {
  metricsLauncherConfig,
  transcriptRegistry,
  now
})
```

身份与任务事实的唯一 authority 是 branded StageContext。options 只含 launcher-issued metrics capability、branded transcript registry capability 与可注入时钟；不得含 root、raw config、裸来源路径或替代 TaskHandle。生产静态登记只维护在 `config/transcript-sources.mjs`，基线导出冻结空数组；测试登记只活在 fixture 内，不落盘。未登记 reader 永远不可调用。

`createTranscriptSourceRegistry(entries)` 用 WeakSet 品牌化冻结 capability。每个 entry 只允许且必须包含：

```js
{
  source_id: "<non-empty stable id>",
  source_ref: "<TaskHandle relative ref or registered opaque ref>",
  source_format: "jsonl",
  source_version: "<non-empty version>",
  required: true | false,
  reader: "<launcher-issued read capability>"
}
```

字段额外、缺失、重复 source_id、空字符串、非 boolean、未品牌化 reader 在 capability 创建时 fail-loud，collector 尚未读取来源/写索引。结构完整但 `source_format/source_version` 没有已登记 adapter 时，collector 为该 source 输出 `unknown/unsupported_format` 并继续。reader 只返回 bytes 或抛稳定错误，不向 collector 暴露宿主路径。

返回值固定为：

```js
{
  status: "success" | "failed",
  files: [
    { ref, saved, error: null | { code, message } }
  ],
  warnings: [{ code, message }]
}
```

`files` 固定按四个目标 ref 排序。任一 `saved=false` 时总体必须为 `failed`；metrics 警告只进入 `warnings`，不改变真实文件结果。

### 4.2 入口身份预检

在读取任何可选来源和写索引前：

1. 验证 branded StageContext、TaskHandle、Workspace；
2. 用 `ctx.kernel.readAccepted("make-decision")` 读取认证事实；
3. 比较 project/task、Workspace real root、baseline commit；
4. 通过 Workspace 受控能力取得当前 snapshot。

失败返回/抛出 `WRONG_WORKTREE` 或更具体完整性错误，且四个索引保持原字节。当前受控 dirty tree 合法，不要求当前 tree 等于 make-decision snapshot tree。

### 4.3 `core/fact-indexes.mjs` 纯函数边界

纯模块不读文件、不拿路径、不写锁。输入为 launcher/collector 已认证并冻结的候选值，输出为：

- `buildTranscriptRecords(...)`：空 registry 生成登记面缺失事实；完整登记 capability 通过对应 reader 读取受控 ref，逐行解析受支持 JSONL；不完整登记为 unknown/unsupported_format，未登记宿主来源不可达；
- `buildArtifactRecords(...)`：从正式 accepted/attempt facts 的明确 ref 字段投影 stage result、handoff、artifact、evidence、review、test；只跟随 canonical 相对 ref，不扫描目录；
- `buildHealthFacts(...)`：从身份、snapshot、review/verify/handoff、前两类索引、closure/metrics 直接事实投影九域；无直接 metrics 证据时 `token_waste=unknown`；
- `buildSkillsInventory(...)`：由已校验 catalog、stage 配置、`skill-deps.yaml`、bundle/closure 结果投影，按 `name,path` 排序并用 M14a schema 校验；
- `mergeJsonl(...)` / `mergeSkills(...)`：锁内既有值与本次候选的确定性合并。

所有 hash 复用 `contentHash`。transcript 正常候选 hash material 固定为 `{record_kind,id,run_id,payload}`；其他索引排除来源位置、诊断与生成时间。`core/fact-indexes.mjs` 用手写 runtime type guards + 冻结常量集合校验三类 JSONL 的 exact keys、类型、nullable 字段、枚举和 additional-key=0；构造、合并、读取既有行、写出前都经过同一 validator，不新增平行 JSON Schema。字段、原因码、错误对象和排序键逐字遵守规格。安全错误消息不得带宿主绝对路径或秘密。

### 4.4 去重、坏行与版本

- transcript/artifact 键为 `(record_kind,id)`；health 键为 `fact_id`；skills 键为 `(name,path)`；
- 同键同 hash 合并来源并去重升序；同键异 hash 产出 `unknown/duplicate_id_conflict`，禁止 first/last-write-wins；
- skills schema 无冲突承载字段，同键异内容使该文件 `saved=false`；
- JSONL 逐行解析，坏行转换成稳定 `unknown/malformed_line` 记录，合法行继续；
- 超出 collector 支持的 `schema_version` 使对应文件失败为 `unsupported_format`，不猜迁移；
- `collector_version` 仅跟实现变化；字段/枚举/语义变化才提升 `schema_version`；
- `generated_at` 是 skills 文件唯一允许变化字段，来自注入时钟。

既有 artifact JSONL 坏行受 REQ-020 固定字段约束：写为 `record_kind=artifact`、`id=bad-line:artifact-index:<line>`、`status=unknown`、`ref/source_ref=indexes/artifact-index.jsonl`、`required=false`、`content_hash=null`、`reason=unsupported_format`，并以 `error.code=MALFORMED_LINE` 保留精确原因。health 坏行用 `fact_id=bad-line:flow-health:<line>`、`domain=artifact_missing`、`status=unknown`、`reason=malformed_line`。这两种都是 REQ-051 所称的可见 parse-error 事实，不增加规格未声明的 record kind/reason。

Artifact 同键异内容的合法冲突对象固定为：保留原 `(record_kind,id)`，`status=unknown`、`content_hash=null`、`reason=duplicate_id_conflict`、`required=任一变体 required`、`error={code:"DUPLICATE_ID_CONFLICT",message:<稳定安全消息>}`；`ref` 和 `source_ref` 分别取候选合法值的字典序最小值；`run_id`、`stage` 仅在所有变体一致时保留，否则为 null。变体 hash 不写入未声明字段；完整冲突只作为 unknown 事实表达，绝不选择任一变体内容。

### 4.5 Artifact 与健康事实来源

TaskHandle 增加窄能力 `listStageAttemptRefs(stage)`：只在受控 `results/<canonical-stage>/` namespace 内枚举匹配 `attempt-NNNN.json` 的普通文件，复验目录身份、拒绝 symlink/非法名，返回排序后的 TaskHandle 相对 refs；不暴露任意目录 listing。Artifact collector 合并该列表与 accepted `attempt_ref`，逐个通过 `readRecord` 认证/解析并去重，再只读取 attempt/accepted 中明确声明的 refs。这样覆盖 REQ-021 的正式 stage attempts，同时不递归扫描任意目录、不猜 latest/alias。不存在的未完成 stage 不伪造 present；正式记录声明 required ref 但读取不到为 missing，认证/解析失败为 unknown。ArtifactDir 只读取正式 facts 指向的命名产物，绝不作为索引写入口。

固定 ref 映射：

| 声明位置 | 分类 | 稳定 ID | required |
|---|---|---|---|
| TaskHandle 列出的 canonical attempt envelope；accepted 标注其绑定关系 | `stage_result` | `<stage>:<attempt_ref>` | true |
| attempt `evidence_refs[].ref` | 按 canonical entity 的 producer/namespace 分类为 `evidence/review/test/artifact` | canonical ref | true |
| make-decision `facts.decision_ref`、reviews 的 `result_ref` | `artifact` / `review` | canonical ref | true |
| build-spec `facts.spec_ref`、review `result_ref` | `artifact` / `review` | canonical ref | true |
| build-plan `facts.plan_ref/tasks_ref`、review `result_ref` | `artifact` / `review` | canonical ref | true |
| build-code/verify-code `facts.tests.receipt_ref/output_ref`、review `result_ref`、`facts.evidence_refs[]` | `test` / `review` / `evidence` | canonical ref | true |
| canonical facts 明确存在的 `handoff_ref` / `handoff_refs[]` | `handoff` | canonical ref | true |

分类必须先认证并读取 canonical entity；不能仅凭文件名猜 producer。`run_id` 只复用 entity 中现有 run identity，否则 null；`stage` 来自声明它的 accepted/attempt。缺字段表示未声明，不生成 missing；字段存在而目标不存在才生成 missing。

健康索引只陈述机器事实：

- `task_dir`、`worktree`：入口预检与 snapshot；
- `review`、`verify`、`handoff`：正式 stage/receipt；
- `transcript`、`artifact_missing`：前两类索引的确定性投影；
- `skill_missing`：调用现有 `checkSkillClosure`/bundle 验证结果，不复制算法；
- `token_waste`：仅已有 metrics 直接事实，否则 unknown。

不加入 severity、root cause、修复建议或 gate。missing/unknown/review failed 只记录，不阻断其他 stage。

### 4.6 锁、原子写与部分失败

一次采集使用一个 `ctx.task.withRecordLock("locks/indexes/fact-collection.lock", ...)` 包住四个目标各自的“读既有值 → 解析/合并 → `writeRecordAtomic`”。单一任务锁仍使每个索引处于独占临界区，并避免两个采集进程产生跨文件交错；不得自己实现 lock、rename、fsync、symlink 或祖先目录校验。

锁内先合并并尝试写 transcript、artifact；health 必须基于本次实际保存的最终记录，前序文件失败时读取并使用仍在磁盘上的完整旧记录，再尝试 health；skills 独立最后写。一个来源失败转事实后继续；一个目标 schema/写入失败只令该文件 `saved=false`，其余文件仍尝试。已成功文件不回滚。单一锁保证一次和并发多次采集后 health 不基于未合并候选；不提供跨故障四文件事务快照。

原子故障 seam 走最小复用：现有 `afterParentPrecheck` 覆盖祖先身份变化，现有 `afterOpenBeforeRename` 覆盖 rename 前失败；只新增现有 hook 无法到达的 `beforeFileFsync` 与 `beforeDirectoryFsync`。生产默认路径及异常语义不变。file-fsync/rename 前失败要求旧目标字节不变；rename 后 directory-fsync 失败只保证目标是完整旧文件或完整新文件、可解析且 `saved=false`，不承诺旧值仍在。

## 5. 实施顺序

### Phase 1：纯合同与确定性算法

先实现固定记录构造、字段校验、safe error、canonical hash、排序、去重、冲突、坏行和版本处理；紧接着完成该层表驱动测试，锁定 missing/unknown、顺序无关和 schema 边界后才接 I/O。

### Phase 2：可信来源投影

实现 StageContext 入口预检和 branded transcript registry；再按 transcript → artifact → health → skills 顺序连接可信来源。顺序理由：health 依赖 transcript/artifact 最终合并记录，skills 独立但需要 closure/bundle 事实。首版生产 registry 明确为空，不引入目录发现机制。

### Phase 3：持久化与 launcher

在单一任务锁内完成四文件各自 merge+atomic write、逐文件结果汇总和失败继续；增加 launcher-issued metrics，入口调用 `recordSkeleton`，退出在 `finally` 调用 `updateOwnResult`，保持 warn-only。然后增加唯一 CLI launcher，不暴露路径覆盖。

### Phase 4：验收与回归

集中 fixture 覆盖 AC-001 至 AC-015；重点双进程并发、错误 Workspace 前置失败、四文件之一失败不假成功、M14a schema 零额外字段。最后运行目标测试、相关回归、全量测试与仓库结构检查。

## 6. 测试策略

新增 `tests/m14b-fact-collection.test.mjs`，内建最小临时 task/git fixture，分五组：

1. identity/happy：AC-001、002、011；错误工作树前预写 sentinel，失败后逐字节比较四文件；
2. source semantics：AC-003、004、005、008；三行混合 JSONL 验证合法行不丢；
3. merge/hash/conflict：AC-006、007、015；反向遍历和注入时钟验证字节稳定；
4. health/skills：AC-009、010、014；Ajv 直接编译 M14a schema并断言 `additionalProperties=0`；
5. persistence：AC-012、013；两个 Node 子进程更新同一索引，验证串行化、完整可解析、无丢失与 health 基于最终合并记录；注入 fsync/rename/ancestor/单文件写失败，按 rename 前后边界验证 saved/overall 与文件完整性。

不建立按 CLI 品牌展开的 fixture 库，不给每份 fixture 单独维护 hash。

验证命令：

```bash
npx vitest run tests/m14b-fact-collection.test.mjs
npx vitest run core/__tests__/task-handle.test.mjs core/__tests__/workspace-manager.test.mjs tests/metrics-taskhandle-v2.test.mjs core/__tests__/check-skill-closure.test.mjs tests/m14a-audit-contract-layer.test.mjs
npm test
npm run check
```

## 7. 失败处理与回滚

- 入口身份失败：立即终止，零索引改写；
- 可选来源失败：生成 missing/unknown，其他来源继续；
- 单文件合同或写失败：该文件失败，其他文件继续，总体 failed；
- metrics 失败：只警告，不篡改索引结论；
- 回滚：删除 launcher 与两个新增模块，撤销 TaskHandle 测试 hook；四份 task-local indexes 可由可信输入重新生成，不涉及 schema migration、全局状态或 Git 历史改写。

## 8. 需求与验收映射

| 范围 | 实现位置 | 验收 |
|---|---|---|
| REQ-001~003 身份/白名单 | launcher + `fact-collector` preflight | AC-001,003,011 |
| REQ-010~014 transcript | branded registry + `fact-indexes` transcript/merge | AC-002,004~007 |
| REQ-020~022 artifact | `fact-collector` ref extraction + `fact-indexes` merge | AC-003,007,008 |
| REQ-030~031 health | `fact-indexes` health projection | AC-009,014 |
| REQ-040~041 skills | catalog/closure adapter + M14a schema | AC-007,010 |
| REQ-050~053 持久化/结果/metrics | `fact-collector` + TaskHandle + launcher | AC-001,012~014 |
| 版本分离 | validators + constants | AC-005,010,015 |

## 9. 宪法检查

- F1/F2：launcher 只建能力，collector 只编排，纯模块处理投影；接口不收裸路径；
- F3/F4/F5、Q1/Q2/Q3：事实采集不设质量门；正式 plan 仍由独立 wh-review 和人工边界确认；
- F6：只写当前 TaskHandle `indexes/`，不建第二身份/证据库；
- F7：本阶段只产计划；不 commit/push/merge/archive/cleanup；
- F8/F9/F10：只做一层最小 branded registry/reader capability，unknown 不假绿，只做一组最小 fixture；
- S1/S2/S3/S6：复用仓库现有能力，不引入外部技能或依赖；
- S4：入口接现有 metrics；
- S5/S7/S8：不新增阶段技能或宿主绑定接口；模块可由子代理独立实现和测试。

## 10. 明确边界

不改已接受规格，不实现生产真实 transcript source、目录扫描、全局索引、LLM 推断、完整 CLI 样本库、样本 hash、M14a schema、新 TaskHandle/Workspace/hash/lock/metrics 平行层，也不启动 build-code。所有实现文件选择均为可逆技术选择，不改变确认范围。
