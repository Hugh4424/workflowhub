# WorkflowHub 执行优先重设计

状态：make-decision 当前方案草案；未进入 build-spec，未改生产代码。

## 1. 目标

WorkflowHub 的首要产品目标是：

> 合法的普通任务可以顺畅执行；交付仍然高质量、可追溯、不假绿；检查、证据、gate、阻塞和维护成本保持在最低必要水平。

这不是“降低质量要求”，而是删除把内部实现误当成用户前置条件的控制面。

## 2. 先定复杂度预算

本批治理交接时只记录一张修改前后对比表：

- public stage、public gate、状态机、canonical writer、evidence store 的修改前后数量；不得增加。
- runtime validator、bridge/adapter、review subject、snapshot/freshness 字段、catalog/bundle、测试文件和测试命令的修改前后数量；目标是净减少或合并，不能只增加兼容层。

这张表是一次性交接事实，不是运行时 gate，不新增计数脚本、schema 或 public command。如果一个修改不能删除或合并现有表面，就不能以“治理”名义加入；只有证明它保护真实写边界且没有现有替代时，才允许保留最小实现。

## 3. 正常路径与异常路径分离

### 正常路径

```text
task-bootstrap 绑定当前工作区
  -> 读取四份当前材料
  -> 现有 stage 执行
  -> 现有 canonical writer 写一次事实
  -> 现有 completion oracle 判断
  -> status/close/release 读取同一 oracle
```

正常路径不依赖：review provider、历史 accepted、catalog closure、stage ready、旧记录、额外 interaction aggregate 或第二工作区。

### 异常路径

错绑工作区、错误写入、哈希冲突、破坏性操作和正式 publication 结构错误必须明确失败；review unavailable、旧记录缺失、catalog 漂移、辅助 evidence 缺失只记录为 unavailable/incomplete，不能把普通工作冻结。

## 4. 控制面收敛

### 4.1 Workspace

- 复用现有 task manifest 记录当前工作区，不新增独立 binding 对象。
- task-bootstrap 只做一次工作区认证；stage runner、TaskHandle、bridge 不再各自猜路径。
- 当前可信 worktree 通过后直接使用；不再为满足内部 deterministic path 另建第二 worktree。
- deterministic path 只允许作为“创建新工作区时的默认值”；读取已有任务时不得强制它、不得强制特定 branch 名，也不得反向要求用户迁移 trusted worktree。
- 旧 manifest 只保留一个只读兼容解析入口；没有真实 reader 就删除，不做多级 fallback。

### 4.2 Materials

- 只保留一个“当前四材料”解析 owner，并复用现有 `ArtifactDir`/material helper；不得再引入 `MaterialWorkspace`、`MigrationArtifactInspector`、能力 token 或第二 writer 作为过渡层。
- 根目录材料与旧 `specs/<task>` 路径不能同时靠“文件存在”猜测；由已有 manifest/任务模式明确选择。
- 只有能指出独立 consumer 的 identity/freshness 字段才保留；重复表达同一当前性的字段合并或删除。
- 旧材料只读，不能写 current fact、close 或 release。

### 4.3 Quality and review

- `TaskKernel` 保持唯一 canonical quality fact writer。
- `deriveStageCompletion` 保持唯一 completion oracle。
- `dsh-code-review` 保持唯一 canonical `code_review`；`wh-review` 只保留已有 advisory/provenance subject。
- review 不成为正常执行 gate；缺失、不可用和 serious finding 保留真实事实，完成声明再据此受限。

### 4.4 Bridge and runner

- bridge 负责传输边界，runner/TaskKernel 负责最终写入认证；共享一个窄 validator，禁止三层各自复制完整校验。
- 只在“错误内容将被正式写入”处 fail-loud；中间层不重复制造 evidence handshake、状态和 gate。
- 调用方只面对一个正向输入契约；不再通过不断增加 `forbidden option` 列表来维护控制面。
- replay、hash、task/workspace 绑定只保留实际保护 publication 的最小字段。

### 4.5 Catalog, bundle and tests

- catalog 是 manifest 的描述性投影，不是执行许可证。
- bundle closure 只在维护/发布检查中报告，不阻塞普通 task stage。
- 测试覆盖真实边界和失败语义；不为每个字段、adapter、projection 再创建一套测试框架、证据文件或 gate。
- 能通过一次真实端到端执行验证的，不另造机器执行通道。

## 5. 删除/合并判据

每个现有对象只允许三种结果：

1. **保留**：能指出唯一 owner、真实 consumer、完成 oracle 和实际失败后果。
2. **合并**：多个对象表达同一事实，迁移到现有 owner，保留最小只读兼容。
3. **删除**：没有代码、manifest、runtime 或用户明确交付证据证明存在真实 consumer；或所有 consumer 已迁移，并有一个负向测试和可恢复记录。

“未来可能有用”“未知但没有任何消费证据”“为了机器可检查”“测试已经依赖”都不是永久保留理由。删除前保留一次可恢复归档；真实 reader 出现时恢复最小兼容，不让未知消费者把 live 控制面永久冻结。

## 6. 实施顺序

1. **P0 盘点与计数**：用现有只读命令和 inventory 统计对象、gate、writer、evidence、validator、字段、bundle、测试命令和阻塞点，冻结当前基线；不新增计数器。
2. **P1 正常执行修复**：先收敛 task-bootstrap/workspace/material locator，证明合法 trusted worktree 能直接执行，不创建第二 workspace。
3. **P2 质量链收敛**：清理重复 review subject、重复 validator、重复 completion/disclosure 读取；保持唯一 canonical writer/oracle。
4. **P3 旧表面清理**：按 consumer census 删除 ghost skill、重复 registry、无消费者 bundle、死 fixture 和 legacy writer；真实 reader 只读兼容。
5. **P4 维护成本核算**：重跑 focused tests 和一次全量 baseline，给出修改前后数量、失败分层、未完成事实和回滚点。

任何阶段若需要新增 public gate/stage/state/writer/evidence store，立即停止并退回 make-decision；不能用新控制面补偿旧控制面的错误。

## 7. 成功标准

- 合法普通任务可在当前 trusted worktree 正常启动和继续，不要求第二 task workspace。
- 已有 trusted worktree 不再被 deterministic path、branch 名或 TaskHandle 存储布局反向阻塞。
- 正常路径不依赖 provider review、历史 accepted、catalog closure 或辅助 evidence。
- 高质量事实仍真实保留：错误写入 fail-loud，review/finding/unavailable/stale/incomplete 不被伪装成 pass。
- public stage/gate/state/writer/evidence store 不增加；内部重复 owner、重复 validator、重复 subject、ghost surface 和无效测试维护面净减少。
- 全量测试失败如实保留；focused green、bundle closure、stage ready 和空 findings 不被写成验收或 release。

## 8. 当前不做

- 不在本轮通过增加校验来修补旧路径模型。
- 不改原始 checkout，不 commit、push、merge、reset、clean、prune。
- 不删除尚未完成 consumer census 的旧记录。
- 不进入 build-spec，直到本设计和 F11 的复杂度边界完成用户确认。

## 9. 3rd-review 修正结论

异源 `3rd-review` 已审查本设计（`pi/coding`，`completed`，7 条意见：4 条 major、3 条 minor）。本设计接受并已修正以下问题：

- deterministic worktree 只用于新建默认值，现有 trusted worktree 走一次认证后直接消费。
- 不新增 `MaterialWorkspace`、`MigrationArtifactInspector`、能力 token 或第二材料 writer；已有重复 seam 进入删除/合并清单。
- 未知外部 consumer 不再让 live 兼容面永久存在；保留可恢复归档，只有出现真实证据才恢复最小只读兼容。
- 删除 forbidden-option 递归校验，改为一个正向输入契约。
- 复杂度只做一次人工前后对比，不新增计数脚本或“复杂度 gate”。
- F11 的“控制面”明确指会阻塞、持久化状态、写事实或改变 public 行为的表面；F11 本身不产生运行时检查。
- `ArtifactDir.reference` 的重复实现列入 P1 删除/合并，不保留两个同名语义。
