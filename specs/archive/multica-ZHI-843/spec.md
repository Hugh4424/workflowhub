# 功能规格：WorkflowHub 宿主恢复能力

**功能名**：`multica-ZHI-843`
**来源**：已接受的 make-decision decision-log、根任务目标、ZHI-827/ZHI-840 阻塞证据
**状态**：规格草案（以正式审查结果为准）

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：在同一 WorkflowHub task 内，安全恢复已绑定的 runner，或把 Phase 指针从 Phase 1 受控退回 Phase 0，并保留全部历史证据。
- **核心改动点**：新增 runner replacement 官方入口；新增 Phase 0 pointer recovery 官方入口；两条恢复各自一次性校验、独立记账；恢复后仍走原有官方 evidence/review/续跑入口。
- **最大影响面**：TaskHandle/TaskKernel 身份与不可变记录、build-code Phase evidence 发布、runner bootstrap 和宿主协议。
- **验收信号**：无凭证或任一身份、来源、收据、树、当前指针不一致时 fail-closed；合法恢复只追加记录并能从官方入口继续；旧记录字节不变，不能跨入口复用门禁。

## 1. 问题陈述

当前 runner 身份写入 task manifest 后，只能按既有身份认证；新 runner 即使来自同一任务，也会因 runner root/OID 不同被拒绝。换 clean runner 会阻塞 ZHI-827 的 build-plan 续走。

当前 Phase evidence 的 `phase-result.json` 只允许首个 Phase、当前 Phase 修复或下一个 Phase 按顺序发布。ZHI-840 的指针已经在 Phase 1，但真实的 Phase 0 receipts/tests 仍存在；现有入口不能在不伪造 `previous_phase_review_ref` 的情况下重新建立 Phase 0 当前结果。本恢复只接受已修正且与既有 Phase 0 `snapshot_tree` 不同的新快照；快照未变化时返回非零退出码 `RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`（recovery not-applicable no-op），不消费恢复门禁。

直接改 task.json、覆盖旧 accepted/result、猜 branch、手工 checkout 冒充认证基线，都会破坏 WorkflowHub 的证据链。本功能只解决这两类已证实阻塞。

## 2. 背景、目标和边界

### 背景

上游已接受以下方向，本文全部继承：

1. runner replacement/reset 与 Phase 0 pointer recovery 是两条追加恢复路径。
2. 旧正式记录永远保留，不手改、不覆盖。
3. runner 来源与业务仓/业务快照分开校验。
4. 两条恢复共用严格校验原则，但恢复门禁按目标独立消耗；一条失败或已使用不影响另一条。
5. Phase 0 恢复后必须重新走正式 evidence/review；新的通过结果才成为当前结果。
6. 恢复期间不得推进 Phase 1 或 Phase 2；合法恢复后由原有官方入口续走。

### 目标

- 让受信宿主使用明确的、任务内不可变的恢复凭证，执行一次 runner replacement。
- 让受信宿主使用真实 Phase 0 implementation/test receipts，建立新的 Phase 0 `awaiting_review` 指针，并通过正式 review 后成为当前 Phase 0 结果。
- 保持 task identity、目标仓、来源关系、accepted receipt/ref/hash/tree 和当前 Workspace 校验链完整。
- 为两个入口提供稳定的 CLI help、错误语义、单元/集成测试和宿主协议说明。

### 非目标（明确不做）

1. 不创建新 task、不迁移到新 task、不重跑 ZHI-827/ZHI-840 的业务 provider/review。
2. 不修改旧 attempt、accepted、Phase receipt、test receipt、review result 或既有 Phase 结果正文。
3. 本期“runner replacement/reset”统一由同一个 `runner-replacement` 入口覆盖：追加新 lineage 并切换当前指针；不新增独立 reset 命令或通用 reset/recover 状态机，也不改变现有 `stage-runtime reopen` 的 build-code 受控 reopen 语义。
4. 不自动颁发恢复凭证，不以任意本地 JSON、cwd、Git remote、branch 名或目录搜索代替受信凭证。
5. 不改 Multica daemon、provider、model、workspace 全局配置，不自动 push/merge/删除 worktree。
6. 不恢复任意历史 Phase；本期只支持“当前指针为 Phase 1、目标为 Phase 0”的已证实阻塞。
7. 不让恢复命令直接调用 provider；Phase 0 恢复后的 review 必须由既有 `wh-review` 官方入口执行。
8. 不直接修改 dirty main；恢复认证只接受已提交的 runner HEAD/OID 和 canonical task records，不吸收工作区未提交改动作为来源或业务快照。

### 方案取舍

- **本期方案：同 task 追加恢复**。保留 accepted decision、旧 runner/Phase 记录和 provenance，恢复后可沿原官方入口续走，且两条门禁可独立 fail-closed。
- **新建 task 或复制 task**：能绕开当前绑定，但会切断原 task 的 accepted receipt/ref/hash/tree 与历史 lineage，不满足同任务恢复目标。
- **手工改 task.json/phase-result.json 或强制 reopen**：改动不可审计、无法证明来源，并绕过现有身份/evidence/review 门禁，因此明确禁止。

结论：两条 append-only 恢复路径是当前阻塞下满足证据链和续走要求的最小可行方案。

### 假设

- **假设 1**：恢复凭证已由受信宿主在明确批准后写入当前 task 的 canonical recovery-credential 记录；本期只负责读取、校验和一次性消费。来源：上游要求“没有恢复凭证时 fail-closed”；理由：不在 WorkflowHub 内再造一套审批系统。
- **假设 2**：Phase 0 的真实 implementation/test receipts 与其依赖的 evidence 仍在同一 task 中。来源：ZHI-840 阻塞证据；理由：跨 task 或跨仓复制会失去 lineage。
- **假设 3**：新 runner 能读取旧 runner 的 Git commit OID。来源：同 task runner replacement 的来源关系要求；理由：用 Git ancestry 证明来源，不用 remote、目录名或猜测。
- **假设 4**：现有 `phase-result.json` 是当前 Phase 指针，允许通过受控 TaskHandle 写入新当前指针；旧指针 bytes 作为 recovery archive 保留。来源：上游“新当前结果替换当前指针、旧结果保留”；理由：不把指针误当成不可变历史正文。

## 3. 用户场景与用例

### 场景一：合法 runner replacement（正常路径）

- **角色**：受信宿主/恢复执行器。
- **前置条件**：task identity 已存在；当前 manifest 已绑定旧 runner；新 runner 是显式绝对路径，branch 为 `task/<project>/<task>`，能验证旧 runner OID 的 ancestry；恢复凭证绑定同一 task、目标仓和已接受 make-decision 业务快照，且 runner 门禁未使用。
- **操作步骤**：使用 runner replacement 官方入口提交显式 task identity、新 runner root、stage 和凭证 ref/hash。
- **预期结果**：入口验证通过后追加 runner replacement record，原 manifest bytes/hash 被保留，manifest 的当前 runner 指针原子切换到新 runner；返回 recovery ref/hash。后续 `task-bootstrap` 与正常 stage 官方入口可用新 runner 认证，并继续原有阶段。

### 场景二：runner replacement 被拒绝（失败路径）

- **角色**：恢复执行器。
- **前置条件**：缺凭证，或凭证 task/project、旧 manifest hash、accepted receipt/hash/tree、旧 runner 来源、新 runner identity 任一不匹配，或门禁已使用。
- **操作步骤**：调用同一官方入口。
- **预期结果**：非零退出并返回稳定错误类别；不写 task.json、manifest archive、runner replacement record，不改其他 recovery gate，不触发 provider/review。

### 场景三：合法 Phase 0 pointer recovery（正常路径）

- **角色**：受信宿主/build-code 协调器。
- **前置条件**：同一 task 的当前 `phase-result.json` 明确为 Phase 1；credential 指定的旧 Phase 0 canonical evidence 为同 task、Phase 0、完整性有效且与独立 formal `wh-review` pass 绑定；Phase 0 的真实 implementation receipt、GREEN/必要 RED test receipt、snapshot tree 和 task-local evidence 可读；phase gate 未使用；本期 recovery 只处理 snapshot 已变化的 Phase 0 新证据；若 snapshot 未变化，入口返回非零退出码 `RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`，将其分类为 recovery not-applicable no-op，保持 pointer/旧记录/gate 不变并终止，不消费 recovery gate；本期不提供跨 Phase same-identity 续走。
- **操作步骤**：使用 Phase pointer recovery 官方入口提交 task identity、build-code runner root 和 phase recovery 凭证；入口写出新的 Phase 0 `awaiting_review` 当前指针。随后用现有 phase evidence 入口、同一 recovery ref 和新的 Phase 0 `wh-review` result 发布 review 结果。
- **预期结果**：旧 Phase 1 指针 bytes 与旧 Phase 0 records 保留；新 Phase 0 只在正式 review `pass` 后变为 `done`/当前结果。随后现有 Phase 1 入口必须用新的 Phase 0 review ref 续走；恢复期间不能发布 Phase 1/Phase 2。

### 场景四：Phase 0 恢复被拒绝或 review 未通过（边界路径）

- **角色**：恢复执行器或 reviewer。
- **前置条件**：当前指针不是 Phase 1、目标不是 Phase 0、任一 receipt/hash/tree 不一致、凭证已用，或正式 review 为 `revise_required`/`unavailable`。
- **操作步骤**：调用恢复或后续发布入口。
- **预期结果**：身份/数据不一致时不改任何记录；若已成功建立 `awaiting_review` 指针但 review 未通过，保留该恢复代次和失败事实，Phase 1/2 续走继续被拒绝，不能把失败改写为 pass，也不能重新使用恢复凭证来再退一次。

### 场景五：两条恢复门禁隔离

- **角色**：受信宿主。
- **前置条件**：runner gate 已使用或失败，phase gate 仍未使用，或反过来。
- **操作步骤**：分别调用两个入口。
- **预期结果**：每条入口只读取自己的凭证和 recovery generation；runner 凭证不能触发 Phase pointer recovery，phase 凭证不能改变 runner；一条 gate 的失败/已使用状态不改变另一条 gate。

## 4. 功能需求

### 域：统一官方入口与凭证

- **FR-REC-001**：新增 `scripts/task-recovery.mjs` 官方入口，提供两个互斥子命令：`runner-replacement` 与 `phase-pointer`。两者都必须显式接收 `--task-path=<absolute> --project=<project> --task=<task> --runner-root=<absolute> --credential-ref=<task-relative-ref> --credential-hash=<sha256>`；`runner-replacement` 另需显式接收 `--stage=<stage>`，`phase-pointer` 另需显式接收固定值断言 `--stage=build-code`，且不得传入其他 stage。来源：上游要求“官方入口、CLI 边界”。
  - **场景**：Given 缺少任一身份、stage、runner root 或 credential 参数, When 调用入口, Then 返回 `RECOVERY_INPUT_REQUIRED`/对应稳定错误类别并不读写业务结果；若 `phase-pointer` 的 runner root 缺失或 identity 与 manifest 不一致，返回 `RECOVERY_RUNNER_IDENTITY_INVALID`，不写入 recovery record、pointer 或 gate 状态。
- **FR-REC-002**：入口只能通过 TaskHandle 打开显式 task path；必须校验 task path、manifest、project、task 三者一致，禁止从 cwd、Git remote、branch、issue ID、目录扫描或“最新任务”推断身份。
  - **场景**：Given 任一显式身份与 task manifest 不一致, When 打开任务, Then 返回 `RECOVERY_TASK_IDENTITY_MISMATCH`，无 mutation。
- **FR-REC-003**：凭证只能引用 task-local、canonical、不可变的 `workflowhub-recovery-credential.v1` record；入口必须校验 record ref 安全、record hash、schema、project/task、recovery kind、`decision`（必须精确为 `accepted`）、一次性 nonce 和目标绑定；nonce 是受信宿主生成的非空 opaque string，只能绑定一个 canonical credential record，在同 kind/generation 与跨 kind replay 中不得复用，缺失、重复或与 canonical ref 不一致均拒绝。凭证由受信宿主批准后写入；不再拆出第二套 approval record。缺 ref、缺 hash、非 canonical ref、hash 不符、未知字段或 decision 不是 `accepted`，均拒绝；不接受 inline credential 覆盖 canonical bytes。
  - **场景**：Given credential record 不存在、被改写、指向另一 task/kind、nonce 缺失/重复或 decision 不是 `accepted`, When 调用任一入口, Then 返回 `RECOVERY_CREDENTIAL_INVALID`，不消费 gate。
- **FR-REC-004**：恢复成功必须写入一个 append-only recovery generation record，记录 task identity、kind、generation、credential ref/hash、旧来源/ref/hash/tree、 新来源/ref/hash/tree、时间和结果；同一 kind 的第二个成功 generation 必须返回 `RECOVERY_ALREADY_USED`，同一 credential 重放也不能再次切换当前指针。
  - **场景**：Given 对应 kind 已存在成功 generation, When 再提交任意新/旧 credential, Then 拒绝且旧 records 与另一 kind 不变。
- **FR-REC-005**：入口在所有校验完成后才在对应 lock 内生成不可见 staging；runner replacement 使用 task manifest lock `locks/task-identity-migration.lock`，phase-pointer 使用既有 `locks/build-code-phase-evidence.lock`；两者门禁和锁命名空间独立。优先复用现有“不可变记录预写、最后单一 current pointer/manifest 原子翻转”的 writer 模式：archive 等 hash-addressed bytes 可先预写，generation 内容可预计算但 canonical generation record 只能在最终原子 current pointer/manifest 提交中落地；gate consumption 与 recovery 摘要必须并入同一次原子 current pointer/manifest 写入。本期不预留第二套 publish/state/barrier 协议；若未来出现单文件原子写无法承载摘要的具体故障证据，另立最小 decision。任何中途失败、目录/文件身份变化、immutable record collision 或最终复核不一致都必须丢弃 staging（允许留下无引用、不可消费的 archive 对象）并 fail-closed，不得留下半个 generation、已消费 gate 或可见 current pointer。
  - **场景**：Given 写入前后任一受信目录、manifest、pointer 或 runner identity 改变, When 发布恢复, Then 返回 `RECOVERY_CONCURRENT_CHANGE`/`RECOVERY_RECORD_CONFLICT`，staging 不可见，generation/gate/pointer/manifest 均不变，目标 task 的可见状态与写入前一致。

### 域：runner replacement

- **FR-RUN-001**：runner replacement 必须读取当前 task manifest 的旧 runner identity 和 `runner_root_migration` lineage；新 runner 必须是显式绝对 real Git toplevel，不能是 symlink，branch 必须精确为 `task/<project>/<task>`，HEAD 必须是完整 commit OID，且对应 `AGENTS.md` 与请求 stage 的 `workflows/<stage>/SKILL.md` 为可读普通文件；认证只接受已提交 HEAD，dirty main 或未提交改动不得作为 runner provenance/业务快照来源。
  - **场景**：Given 新 runner 嵌套、symlink、非 Git toplevel、branch/HEAD/stage skill 不合法, When 调用入口, Then 返回 `RECOVERY_RUNNER_IDENTITY_INVALID`，不改 manifest。
- **FR-RUN-002**：runner replacement 必须分开验证 runner 来源和业务快照。新 runner HEAD 必须能读取旧 runner OID 且旧 OID 是新 HEAD 的祖先；credential 的 `previous_manifest_hash` 必须精确等于当前 manifest 的 SHA-256，credential 的 `new_runner` 必须与新 runner identity 完全相等。manifest hash 不一致返回 `RECOVERY_MANIFEST_HASH_MISMATCH`；不得以 target repo 的 commit/tree、目录名或 remote 代替 runner provenance。
  - **场景**：Given 旧 OID 的 Git 对象不可读, When 调用入口, Then 返回 `RECOVERY_RUNNER_ANCESTRY_UNREACHABLE`，不改 manifest；Given 当前 manifest SHA-256 与 credential.previous_manifest_hash 不同, Then 返回 `RECOVERY_MANIFEST_HASH_MISMATCH`；Given 旧 OID 可读但不是新 HEAD 祖先，或 new runner path/OID/branch/stage 与 credential 不同, Then 返回 `RECOVERY_RUNNER_PROVENANCE_MISMATCH`，不改 manifest。
- **FR-RUN-003**：runner replacement 必须从 TaskKernel 读取当前 accepted make-decision；credential 的 `accepted_business_snapshot` 必须同时绑定 `results/make-decision/accepted.json` 的 ref/hash、task identity、accepted facts 的 baseline commit/snapshot tree 和 manifest target repo。任一 ref/hash/commit/tree/target repo 不一致时拒绝；不得把 runner tree 当业务 tree。
  - **场景**：Given accepted make-decision 缺失、integrity hash 不符、credential 指向旧/另一 task 的 business snapshot 或 manifest target repo 无法验证, When 调用入口, Then 返回 `RECOVERY_BUSINESS_SNAPSHOT_MISMATCH`，不改 manifest。
- **FR-RUN-004**：成功 runner replacement 必须把旧 manifest bytes 及 SHA-256 写入 immutable archive，追加 `task-runner-root-replacement.v1` record，并通过 TaskHandle 的原子 manifest writer 更新当前 runner root/OID/recovery pointer；manifest schema 校验需手术式扩展以接受 replacement pointer/ref/integrity，保持旧 `runner_root_migration` 的校验语义不变；其 previous-manifest 重构 hash 必须显式排除/归一化新增 replacement 字段，或走独立 replacement lineage normalizer，使旧 `previous_manifest_hash` 不变式在 replacement 后仍可重算通过；generation、runner gate 和 manifest current pointer 必须在同一 commit boundary 生效，失败时只保留不可消费 staging；不得覆盖旧 migration record，不得手工写 task.json。
  - **场景**：Given 合法凭证与新 runner, When 发布 recovery, Then old manifest hash 可由 archive 重算，new manifest hash 可由 record 重算，task bootstrap 只认证新 runner。
- **FR-RUN-005**：runner replacement 只消耗 runner gate；成功后现有 `task-migrate-runner-root.mjs` 对已绑定 task 仍保持初次绑定/相同 identity replay 语义，新的 replacement 不能被它绕过；normal stage-runtime 不新增 `--runner-root` 注入。
  - **场景**：Given runner replacement 已成功, When 用旧 runner、不同 runner 或 stage-runtime 的 caller injection 继续, Then 认证失败；用新 runner 的官方 `task-bootstrap`/stage entry 才能通过。
- **FR-RUN-006**：runner replacement 输出只允许包含人类可读状态、task-relative recovery ref/hash、旧/新 runner identity 摘要和下一官方入口名称；provider secret、宿主配置、猜测数据和上述清单之外的字段一律禁止返回或写入。
  - **场景**：Given replacement 成功, When 下游执行官方 bootstrap, Then 可继续当前原有阶段链，不生成新 task、不改 accepted business result。

### 域：Phase 0 pointer recovery

- **FR-PTR-001**：phase-pointer 入口只允许 `current.phase_id=phase-1`、`target.phase_id=phase-0`；必须从 TaskKernel/TaskHandle 读取并 hash 当前 `phase-result.json`，credential 必须绑定当前指针 ref/hash、旧 Phase 1 snapshot、目标 Phase 0 snapshot、被保留的旧 Phase 0 canonical evidence ref/hash、其 formal review ref/hash 和同一 task。旧正式 Phase 0 snapshot 只能来自 credential 指定的 `baseline_phase0_evidence_ref/hash`：该 ref 必须解析到 task-local `evidence/phases/phase-0/` 中由现有 phase evidence writer 追加的 canonical evidence record，校验 task/stage/phase_id=phase-0、`snapshot_tree`、receipts 和 integrity hash；其 `baseline_phase0_review_ref/hash` 必须再解析为同 task、同 snapshot 的正式 `wh-review` pass。canonical evidence 的发布状态可能是 `awaiting_review`，最终通过事实由该 evidence 与独立 formal pass review 共同证明；不从 current pointer、evidence leaf 或“最新记录”推断。基线 evidence/review ref 缺失、内容重复或完整性/正式通过校验失败时拒绝。入口在写入前先比较目标 Phase 0 snapshot 与该旧 Phase 0 canonical evidence 的 `snapshot_tree`：若未变化，返回非零退出码 `RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`（recovery not-applicable no-op），保持 pointer、旧记录和 gate 不变并终止本恢复；当前指针为 Phase1 且目标为 Phase0 时不存在可直接复用的跨 Phase same-identity 官方路径，禁止落入原 next-Phase `deriveBaseline` 或伪造 `previous_phase_review_ref`，宿主需先准备符合恢复条件的新 snapshot/凭证或人工处理；若已变化，才继续 recovery 校验。当前指针缺失、不是 Phase 1、目标不是 Phase 0、旧/新 snapshot 不符或 gate 已用时拒绝。
  - **场景**：Given 当前指针为 Phase 1、credential 指定的旧 Phase 0 canonical evidence 与 formal pass review 合法且目标 credential 合法, When 调用入口, Then 只进入 Phase 0 recovery generation；Given 当前为 Phase 0/Phase 2 或指针已变化, Then 返回 `RECOVERY_PHASE_POINTER_MISMATCH`，不改 pointer。
- **FR-PTR-002**：入口必须只接受 task-local 真实 Phase 0 implementation receipt、GREEN test receipt、必要 RED evidence 和其 evidence closure；closure 的根是这些 receipt/evidence ref/hash，遍历每个记录中显式的 task-relative refs，必须解析到 `receipts/`、`evidence/` 或 `evidence/phases/phase-0/<snapshot-tree>/` 允许 namespace 内的记录，最终到无 refs 的叶记录终止；任何绝对路径、`..`、namespace 外 ref、缺失记录、hash 不符、重复 ref、循环或超过已声明根的扩张都拒绝。逐一校验 schema、task/stage/producer、receipt ref/hash、snapshot tree、snapshot commit/tree 关系、测试 exit code、output hash、baseline tree、allowed files 和 Phase id。禁止从 `previous_phase_review_ref` 推断 Phase 0 已通过。
  - **场景**：Given 任一 receipt 缺失、复制自另一 task、hash/tree/output 不符、Phase id 不是 0 或 evidence 闭包不可读, When 调用入口, Then 返回 `RECOVERY_PHASE_EVIDENCE_MISMATCH`，不写 pointer。
- **FR-PTR-003**：入口先在 recovery lock 内预写旧 `phase-result.json` exact bytes archive 和新的 Phase 0 `awaiting_review` candidate，同时预计算但不落地 canonical generation record；优先沿现有单一 current pointer 原子翻转模式，把 phase gate consumption 与 recovery 摘要写入同一个 `phase-result.json` commit，commit 前 generation/gate/pointer 都不可见且 credential 未消费。本期只使用现有单一 current pointer 原子写入，不引入额外 barrier。构造 candidate 时，`publishBuildCodePhaseEvidence` 必须在 `publishLocked` 的 closed/needs_revision same-Phase guards 以及现有 `current.phase_id !== input.phase_id` 的 next-Phase `deriveBaseline` 逻辑之前识别 `recovery_ref`，使用 accepted build-plan checkpoint 作为 Phase 0 baseline，不读取或伪造 `previous_phase_review_ref`，再复用共同的 receipt/tree/diff-scan writer。只有 candidate 全部复核通过后才在同一原子提交中落地 canonical generation record、current pointer、generation 摘要和 gate；提交失败时 staging 不可见且 credential 可按原规则重试。提交成功后 `awaiting_review` 是有效的恢复事实；后续 formal review 的 `revise_required`/`unavailable` 不回滚该事实，而保留失败状态并继续阻断 Phase 1/2。新 pointer 必须带 recovery ref/hash、目标 snapshot 和真实 receipts；不得直接落入原有 next-Phase 分支。
  - **场景**：Given 旧 pointer bytes 为 P、credential 指定的旧 Phase 0 canonical evidence 与 formal pass review 合法、Phase 0 receipts/tree 为 S, When recovery transaction 成功, Then archive bytes 恰为 P，generation/gate/current pointer 同时可见，new pointer 为 Phase 0/awaiting_review，且只引用 S 的真实 records；Given candidate publish 或 commit 失败, Then staging 不可见，旧 pointer/gate/records 保持不变。
- **FR-PTR-004**：新 Phase 0 必须用既有 `wh-review` 正式 Phase review；review packet 绑定新的 Phase 0 base/candidate tree 和新的 material/result identity，不能复用旧 Phase 0 review；`review_result_ref` 缺失或不是同一 snapshot 的正式结果时不得标记 `done`。`pass` 才完成当前 Phase 0；`revise_required`/`unavailable` 只能保留失败/未完成事实。
  - **场景**：Given recovery pointer 为 awaiting_review, When review 不是同 snapshot、是旧 ref、返回 revise_required/unavailable 或未通过正式发布, Then Phase 0 不得变为 done，Phase 1/2 续走被拒绝。
- **FR-PTR-005**：`stage-runtime publish-phase-evidence` 继续使用既有 `--input=<phase-evidence.json>` JSON 载荷承载受控 `recovery_ref`（必要时带对应 hash），不新增 CLI 参数或改变现有参数白名单；仅当当前 Phase 0 pointer 的 recovery ref 与 generation、target receipts、snapshot 完全一致时，才允许附加该 recovery generation 的首次 review；首次 review 为 `revise_required` 后，既有 same-Phase repair 规则（ctx-phase-evidence-b）允许修正 snapshot，不重新消费 gate。Phase 0 `pass` 后，现有 Phase 1 入口必须以新的 Phase 0 `review_result_ref` 作为 `previous_phase_review_ref` 续走；若 fresh review 返回 `revise_required`，recovered Phase 0 沿既有 same-Phase repair 路径生成新的 candidate/review，保留同一个 `recovery_ref`/generation，并以该 `revise_required` review 作为 repair 的 `previous_phase_review_ref`；repair 可绑定修正后的新 snapshot，但不得再次消费 recovery gate。只有新的 formal `pass` 才能续走 Phase 1；Phase 2 仍按既有顺序等待 Phase 1。
  - **场景**：Given 新 Phase 0 review pass, When 发布 Phase 1 且 previous ref 指向新 review, Then 正常顺序恢复；Given fresh review 为 `revise_required`, When 走既有 same-Phase repair, Then recovery_ref/generation 保持不变、不消费 recovery gate，repair 可绑定新 snapshot 并以 revise review 为 previous ref；Given recovery_ref 指向另一 task/Phase/generation, Then `RECOVERY_PHASE_CONTINUATION_MISMATCH`。
- **FR-PTR-006**：phase-pointer 只消耗 phase gate，不改变 runner manifest/runner gate；恢复完成前所有 Phase 1/2 publish、phase gate 和下游续派必须 fail-closed；恢复失败不影响 runner replacement。
  - **场景**：Given phase gate awaiting_review 或已使用, When 尝试发布后续 Phase 或 runner replacement, Then 前者拒绝且后者按独立 runner gate 正常判定。

### 域：错误、兼容性与协议

- **FR-ERR-001**：错误输出必须包含稳定 machine-readable category、失败对象（identity/credential/provenance/receipt/tree/pointer/gate/concurrency）和下一可执行动作；不得输出“继续试试”、猜测路径或把质量失败改写为成功。至少固定：`RECOVERY_INPUT_REQUIRED`、`RECOVERY_CREDENTIAL_INVALID`、`RECOVERY_TASK_IDENTITY_MISMATCH`、`RECOVERY_RUNNER_IDENTITY_INVALID`、`RECOVERY_RUNNER_PROVENANCE_MISMATCH`、`RECOVERY_RUNNER_ANCESTRY_UNREACHABLE`、`RECOVERY_MANIFEST_HASH_MISMATCH`、`RECOVERY_BUSINESS_SNAPSHOT_MISMATCH`、`RECOVERY_PHASE_POINTER_MISMATCH`、`RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`、`RECOVERY_PHASE_EVIDENCE_MISMATCH`、`RECOVERY_PHASE_CONTINUATION_MISMATCH`、`RECOVERY_ALREADY_USED`、`RECOVERY_CONCURRENT_CHANGE`、`RECOVERY_RECORD_CONFLICT`。
  - **场景**：Given 任一拒绝路径, When CLI 退出, Then exit code 非 0、类别稳定、没有 mutation；需要重新生成凭证时明确说明，不要求手改记录。
- **FR-COMP-001**：保持向后兼容：未绑定 runner 的旧 task 继续只使用现有 `task-migrate-runner-root.mjs`；正常 stage-runtime、accepted record、`stage-runtime reopen`、Phase 顺序和已有 TaskContext 合同不变。新 recovery record/manifest pointer 是追加扩展；旧 task 不带 recovery pointer 时按旧路径读取。
  - **场景**：Given 旧 task 无 recovery record, When 走普通 stage 或初次 runner migration, Then 结果与当前行为一致；只有显式 recovery credential 才触发新路径。
- **FR-DOC-001**：`scripts/task-recovery.mjs --help`、两个子命令 help 和 WorkflowHub 宿主协议必须说明：参数（其中 `phase-pointer` 的 `--stage=build-code` 是固定值断言，不是可选 stage）、credential ref/hash、成功输出、稳定错误类别、单次 gate、旧记录保留、Phase 0 review/续走和禁止项。文档不得把手工编辑 task.json、phase-result.json 或伪造 previous ref 作为恢复步骤。
  - **场景**：Given 用户查看 help/协议文档, When 按成功示例执行, Then 能识别需要的凭证、校验边界、失败动作和恢复后的官方续走。

## 5. 模块划分（条件触发）

### 恢复入口与 TaskKernel 扩展

- **负责什么**：解析两个子命令，打开显式 TaskHandle，校验 credential，调用受控 runner replacement/Phase pointer recovery 能力。
- **对外提供什么业务能力**：两个稳定 CLI 入口、结构化成功/错误输出。
- **需要哪些上游业务能力**：TaskHandle 的路径/原子记录、TaskKernel 的 accepted/receipt/hash 读取、runner identity 检查、Workspace/phase evidence writer。
- **验收边界**：无 provider、无 cwd 推断、无手工 task record 写入；所有拒绝路径无 mutation。

### runner identity lineage

- **负责什么**：验证旧 runner manifest lineage、新 runner Git branch/HEAD/skill 和 ancestor 关系，原子替换当前 runner pointer。
- **对外提供什么业务能力**：同 task 的一次 runner replacement，供后续 `task-bootstrap` 与 stage runtime 认证。
- **需要哪些上游业务能力**：现有 `inspectRunnerIdentity`、task manifest/archive writer、accepted make-decision 读取。
- **验收边界**：不验证/覆盖业务代码树，不改变 target repo 和 accepted decision。

### build-code Phase evidence recovery

- **负责什么**：保存旧 pointer，验证真实 Phase 0 receipts/tree，建立 Phase 0 awaiting_review，绑定 fresh formal review，并阻断后续 Phase 直到 pass。
- **对外提供什么业务能力**：Phase 0 当前指针可被官方 Phase evidence/review/Phase 1 续走使用。
- **需要哪些上游业务能力**：现有 `publishBuildCodePhaseEvidence`、phase diff scan、`wh-review`、TaskHandle record lock。
- **验收边界**：不接受 previous Phase review 伪造、不覆盖旧 Phase records、不恢复 Phase 2 或任意历史 Phase。

### 测试与宿主文档

- **负责什么**：覆盖 schema、拒绝路径、原子性、门禁隔离、CLI help 和下游续走。
- **对外提供什么业务能力**：可复现的单元/集成证据与操作说明。
- **需要哪些上游业务能力**：临时 Git fixtures、正式 TaskKernel/phase evidence/review contracts。
- **验收边界**：测试不能直接改 canonical old records 来制造 pass，必须走官方入口。

## 6. 关键实体（条件触发）

### workflowhub-recovery-credential.v1

任务内不可变、由受信宿主在明确批准后写入的凭证。入口只接收其 task-relative ref/hash，不接收会覆盖 canonical bytes 的 inline JSON；凭证本身携带 `decision: "accepted"`，入口按 canonical bytes/hash 重新校验该字段和全部目标绑定。

- **字段**：`schema_version`、`project_name`、`task_id`、`recovery_kind`（`runner-replacement` 或 `phase-pointer`）、`nonce`、`issued_at`、`decision`（必须为 `accepted`）、`accepted_business_snapshot`、以及 kind-specific `runner_subject` 或 `phase_subject`。
- **runner_subject**：`previous_runner`、`new_runner`、`previous_manifest_hash`、目标 stage；新 runner identity 必须与 CLI 显式参数和 Git 实况完全一致。
- **phase_subject**：`current_pointer_ref`、`current_pointer_hash`、`baseline_phase0_evidence_ref`、`baseline_phase0_evidence_hash`、`baseline_phase0_review_ref`、`baseline_phase0_review_hash`、`current_phase_id`（必须 `phase-1`）、`target_phase_id`（必须 `phase-0`）、目标 baseline/snapshot tree、implementation/GREEN/RED receipt ref/hash 和 allowed files；baseline canonical evidence 必须与同 snapshot 的 formal pass review 共同证明旧 Phase 0 已通过。
- **关系**：一个 credential 只能授权一个 recovery kind 的一次成功 generation；两个 kind 的 nonce/记录/lock/consumption 独立。

### recovery generation record

- **定义**：一次成功的恢复事实，不是可编辑状态。
- **字段**：`schema_version`、task identity、recovery kind、generation、credential ref/hash、前后 manifest 或 pointer ref/hash、前后 runner/Phase identity、snapshot/tree、created_at、result。credential 不再单独携带 generation 字段，凭证格式版本只由 `schema_version` 表示；generation record 的 `generation` 表示该 recovery kind 的成功代次序号。
- **生命周期**：验证失败不产生；成功后永久保留；同 kind 再次申请拒绝；旧 bytes 由 archive ref/hash 保护。

- **形式化 schema 交付约束（下游 build-plan 必须产出）**：以下仅作为 build-plan 产出的 schema 验收清单，不是第二份 machine-readable schema；唯一 machine-readable source of truth 由 build-plan 交付的 JSON Schema 文件承担，避免规格文字与 schema 漂移。schema 必须设置 `additionalProperties: false`，并冻结以下行为约束：
  - credential 顶层必须绑定 task identity、`recovery_kind`、nonce、issued_at、`decision=accepted`、`accepted_business_snapshot` 和恰好一个 kind-specific subject；recovery kind 只能是 `runner-replacement` 或 `phase-pointer`。
  - accepted business snapshot 必须包含 make-decision ref/hash、baseline commit、snapshot tree 和 target repo；ref 为 task-relative canonical ref，hash 为小写十六进制，commit/tree 为完整 Git OID，target repo 必须与 manifest 绑定。
  - runner subject 必须表达 previous/new runner identity、previous manifest hash 和 target stage；phase subject 必须表达 current pointer ref/hash、`baseline_phase0_evidence_ref/hash`、旧 formal review ref/hash、Phase1→Phase0、target snapshot、implementation/GREEN/RED receipts 与 allowed files，并绑定旧正式 pass review；嵌套值的 required/type/path 约束由 build-plan schema 固化。
  - generation record 必须绑定 task identity、kind、generation、credential ref/hash、before/after identity、snapshot/tree、created_at 和受限 result；before/after ref/hash 必须为 task-relative canonical values，禁止未知字段和调用方自定义扩展。build-plan 必须同时交付 schema 文件、校验入口、错误映射及覆盖这些 required/format/enum/extra-field 约束的测试。

### Phase current pointer

- **定义**：task-local `phase-result.json` 的当前正式 Phase 视图。
- **关键字段**：既有 Phase evidence 字段，加 `recovery_ref`/`recovery_hash` 和 recovery generation 摘要；Phase 0 恢复时 status 为 `awaiting_review`，review pass 后才是 `done`。
- **关系**：旧 Phase 1 pointer 只作为 archive 历史；Phase 0 pass 的新 review ref 是后续 Phase 1 的唯一 previous ref。

## 7. 数据和生命周期（条件触发）

- **数据粒度**：单 task、单 recovery kind、单 generation。
- **数据时效**：credential、archive、generation、receipt、review 永久 append-only；current runner manifest pointer 与 `phase-result.json` 是受控 current pointer。
- **数据归属与生命周期约束**：TaskKernel 持有 task records；Workspace 持有 Git snapshot/ref；runner record 只说明 WorkflowHub runner provenance；业务仓/runner 的 tree 不互相替代。
- **清理策略**：本期不清理、不压缩、不删除旧 records、archive、receipts、tests、reviews；任何清理另立需求。

### Canonical record namespaces

- 凭证：`identity/recovery-credentials/<kind>/<nonce>.json`
- runner archive：`identity/recovery-archives/runner-manifest-<sha256>.json`
- Phase pointer archive：`identity/recovery-archives/phase-result-<sha256>.json`
- runner generation：`identity/recoveries/runner-replacement-0001.json`
- phase generation：`identity/recoveries/phase-pointer-0001.json`
- current Phase pointer：`phase-result.json`

所有路径由 TaskHandle/ArtifactDir 的受控 writer 验证；调用方不自行拼接 storage root、task root 或 artifact root。

## 8. 兼容性预留（条件触发）

- **向后兼容**：保留旧 manifest 的 `runner_root_migration`；新增 runner replacement lineage 字段只在成功 recovery 后出现。旧 stage 读取仍只读当前 canonical runner identity。
- **扩展预留**：保留 `recovery_kind`、generation record 的 `generation` 和 kind-specific subject 的明确枚举；不预留任意 reset kind、任意 Phase 回退或可变 status 字段。未来新增恢复目标必须另立 decision/spec，不复用本期 gate。

## 9. 不做和隐性必达

### 明确不做

1. 手改 `task.json`、`phase-result.json`、accepted/attempt/receipt/review；所有 current pointer 变化都经过官方 writer。
2. 覆盖/删除旧正式记录，或把 archive 当作下游输入旁路。
3. 用新 task、猜分支、Git remote、路径 basename、cwd、issue ID 或手工 checkout 冒充认证来源。
4. 用旧 Phase 0 review 或 `previous_phase_review_ref` 伪造新 Phase 0 通过。
5. 恢复期间推进 Phase 1/2，绕过 `wh-review`、verify 或既有 gate。
6. 修改外部运行配置、调用 provider、创建自动凭证颁发器。

### 隐性必达

- **隐性必达 1**：所有恢复判断先校验同一 task identity，再校验 provenance、receipt/ref/hash/tree，最后才有任何 mutation。
- **隐性必达 2**：失败路径不消耗目标 gate；成功路径只消耗目标 gate；另一 gate 的记录永不成为当前判断输入。
- **隐性必达 3**：返回的 recovery ref/hash 只引用 canonical task record；任何 consumer 重新读取并核验，而不是信任 CLI 输出副本。
- **隐性必达 4**：Phase 0 恢复的当前结果在 `awaiting_review` 或 `revise_required` 时，任何 Phase 1/2 官方发布都 fail-closed；只有新的 Phase 0 formal `pass` 允许续走。
- **隐性必达 5**：所有文件/目录校验包含 symlink、realpath、祖先目录身份、atomic write 和并发复核；不能宣称超出当前 TaskContext 合同的同 UID 恶意竞态防护。

## 10. 验收清单及未决问题

### 验收检查（success_criteria）

- [ ] **AC-REC-01**：两个入口缺少 credential ref/hash、credential 不存在或 hash 不符时非零退出，稳定返回 `RECOVERY_INPUT_REQUIRED`/`RECOVERY_CREDENTIAL_INVALID`，且 task.json、phase-result.json、recovery namespace 和另一 gate 都无变化。← FR-REC-001/003
- [ ] **AC-REC-02**：project/task/task path/credential kind 任一不一致时拒绝；不从 cwd、remote、branch 或 issue ID 推断身份。← FR-REC-002/003
- [ ] **AC-REC-03**：通过 fault-injection 集成测试在 generation/pointer/manifest 提交中途制造失败、immutable record collision 或并发身份变化，断言返回 `RECOVERY_CONCURRENT_CHANGE`/`RECOVERY_RECORD_CONFLICT`，无半个 generation、已消费 gate 或可见 current pointer/manifest 残留；允许存在但不可消费的无引用 archive staging，task 可见状态与写入前一致。← FR-REC-005
- [ ] **AC-REC-04**：credential nonce 缺失、重复、与 canonical ref 不一致或跨 kind/generation 重放时返回 `RECOVERY_CREDENTIAL_INVALID`，不消费任何 gate；credential schema version 与 recovery record generation 的语义分别按 §6 校验。← FR-REC-003
- [ ] **AC-RUN-01**：合法新 runner 满足 real Git toplevel、精确 task branch、完整 HEAD、AGENTS/stage skill、旧 OID ancestor 和 credential 完全绑定；官方入口成功追加 generation，旧 manifest bytes/hash 可重算，当前 manifest 原子切换，且 replacement 后旧 `runner_root_migration` 的 previous-manifest hash 不变式仍可通过。← FR-RUN-001/002/004
- [ ] **AC-RUN-02**：accepted make-decision 不存在或 ref/hash/baseline/tree/target repo 任一不一致时 fail-closed；runner tree 不得代替业务 tree。← FR-RUN-003
- [ ] **AC-RUN-03**：runner generation 已存在或同凭证重放时返回 `RECOVERY_ALREADY_USED`；只影响 runner gate，phase gate 仍可独立判定。← FR-REC-004/FR-RUN-005/FR-PTR-006
- [ ] **AC-RUN-04**：replacement 后，用新 runner 运行官方 `task-bootstrap` 和原 stage entry 成功，用旧/错误 runner 或 stage-runtime caller injection 失败；ZHI-827 可从原 task 继续，不创建新 task。← FR-RUN-005/006
- [ ] **AC-RUN-05**：旧 runner OID 的 Git 对象不可读时返回 `RECOVERY_RUNNER_ANCESTRY_UNREACHABLE`，旧 OID 非祖先或 runner 与 credential 不一致时返回 `RECOVERY_RUNNER_PROVENANCE_MISMATCH`；两者均无 manifest/recovery mutation。← FR-RUN-002/FR-ERR-001
- [ ] **AC-RUN-06**：credential.previous_manifest_hash 与当前 manifest SHA-256 不一致时返回 `RECOVERY_MANIFEST_HASH_MISMATCH`，不写 archive、generation、gate 或 manifest。← FR-RUN-002/FR-ERR-001
- [ ] **AC-RUN-07**：dirty main 或带未提交改动的 runner 不能作为认证来源；入口返回 `RECOVERY_RUNNER_IDENTITY_INVALID`，不写 archive、generation、gate 或 manifest。← FR-RUN-001
- [ ] **AC-PTR-01**：仅当 current pointer 为 Phase 1、target 为 Phase 0、credential 指定的旧 Phase 0 canonical evidence 与 formal pass review 共同证明同 task 的正式 pass、snapshot 已变化、所有真实 Phase 0 receipt/test/tree/hash/closure 有效时，pointer recovery 成功；snapshot 未变化时返回非零退出码 `RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`（recovery not-applicable no-op），pointer、旧记录和 gate 均不变且不进入 same-identity 续走；宿主必须另行准备符合条件的新 snapshot/凭证；其他不满足都无 mutation。← FR-PTR-001/002
- [ ] **AC-PTR-02**：成功 recovery transaction 后，旧 `phase-result.json` exact bytes、旧 Phase 0 canonical evidence、receipts/tests 与 formal review 均可从原 ref/hash 重算；generation、phase gate 和新 pointer 同时提交为 Phase 0/`awaiting_review`，带 recovery ref/hash，且无伪造 `previous_phase_review_ref`；candidate/commit 失败时三者均不可见。← FR-PTR-003
- [ ] **AC-PTR-03**：Phase 0 必须用新 snapshot 的正式 `wh-review`；旧 review、错误 tree、`revise_required`、`unavailable` 或缺 review 均不能使 Phase 0 `done`；`revise_required` 后的 same-Phase repair 保留 recovery_ref/generation、不重复消费 recovery gate，并可绑定修正后的新 snapshot，直到新的 formal `pass`。← FR-PTR-004/005
- [ ] **AC-PTR-04**：Phase 0 formal pass 后，现有 Phase 1 官方入口仅接受新的 Phase 0 review ref；恢复期间 Phase 1/2 publish 被拒；Phase 1 成功后才可按原顺序推进 Phase 2。← FR-PTR-005/006
- [ ] **AC-GATE-01**：runner 与 phase 两组 credential/generation/lock/used 判断完全隔离；runner gate 的成功/失败/已用不改变 phase gate，反之亦然；跨 kind credential 拒绝。← FR-REC-004/FR-PTR-006
- [ ] **AC-ERR-01**：帮助文档列出两入口参数、凭证边界、成功输出、稳定错误类别、单次限制、旧记录保留和官方续走；所有拒绝场景可由 CLI/integration test 复现，错误不泄露 secrets。← FR-ERR-001/FR-DOC-001
- [ ] **AC-COMP-01**：现有初次 runner migration、normal stage-runtime、build-code verify-failure reopen、normal Phase 顺序和旧 task 读取测试保持通过；新能力不修改外部配置。← FR-COMP-001

### 未决风险和问题

- **~~未决 1（恢复方向）—— 已决~~**：两类恢复均追加新代次，旧记录保留，门禁独立消耗；来源：accepted decision-log。
- **~~未决 2（Phase 0 范围）—— 已决~~**：本期只支持 current Phase 1 → target Phase 0；不实现任意 Phase rewind；来源：ZHI-840 已证实阻塞。
- **~~未决 3（宿主凭证颁发）—— 已决~~**：生产凭证由受信宿主写入单一 canonical `workflowhub-recovery-credential.v1` record，本期不新增生产颁发 CLI；实现必须提供 test-only credential fixture/writer 写入同一 schema，覆盖两条成功集成路径，且拒绝调用方 inline 覆盖。
- **运行风险 4（旧 runner Git 对象不可达）**：若新 runner 无法读取旧 runner OID 的 Git 对象，恢复应以 `RECOVERY_RUNNER_ANCESTRY_UNREACHABLE` 拒绝；不通过 remote、人工 hash 或猜测补救。风险：需先准备保留旧 OID 的 runner clone/worktree。

## 11. 影响范围（业务性质）

- **受影响功能：任务身份与 runner bootstrap**
  - 既有行为：已绑定 runner 必须精确匹配 manifest。
  - 本需求影响：增加有凭证、一次性的同 task replacement；普通认证规则不变。
  - 回归要点：旧 migration、manifest lineage、旧/错误 runner 拒绝。

- **受影响功能：build-code Phase evidence**
  - 既有行为：Phase 只按顺序推进，current pointer 由官方 writer 写入。
  - 本需求影响：增加受限 Phase 1→Phase 0 current pointer recovery；fresh review pass 后按正常 Phase 1 续走。
  - 回归要点：旧 Phase result/receipts/reviews 不变；Phase 0 review/tree/previous ref 严格绑定。

- **受影响功能：TaskContext、TaskKernel 和宿主协议**
  - 既有行为：路径显式、记录受控、失败 fail-loud。
  - 本需求影响：增加两个明确 namespace 和 recovery refs，不改变身份解析规则。
  - 回归要点：symlink/realpath、atomicity、concurrency、stable errors、help。

- **可能受冲击的业务规则**：恢复期间 Phase 顺序、accepted/review/verify 屏障、runner 与业务快照的职责分离。
- **明确无影响**：Multica daemon/provider/model/workspace 全局配置；原有 task 的 issue metadata；无关 task 与业务 provider/review。

## 12. 下游 build-plan 输入

build-plan 必须把本规格拆成至少四个可独立验收的实现面：

1. recovery credential/TaskKernel/record namespace 与原子一次性门禁；
2. runner replacement CLI、runner provenance 与 manifest lineage；
3. Phase 0 pointer recovery、fresh formal review 绑定与 Phase 1 continuation；
4. CLI help、宿主协议、unit/integration/compatibility tests；测试必须通过受控 test-only credential fixture/writer 生成真实 canonical credential，覆盖 success 与 reject，不把 fixture 当生产审批系统。

下游必须保留本规格的 FR/AC 编号，按每个 FR 给出实现文件、测试证据、失败语义和不变式；不得把未决凭证颁发方式扩成新的通用审批系统，也不得在 build-code 中手工修改历史 records。
