# 实施计划：multica-isolation-recovery-v2

**Task ID**: workflowhub/multica-isolation-recovery-v2  
**Date**: 2026-07-17  
**Spec**: spec.md，accepted build-spec content hash fed12afa8a63299f1e14df2c3ce8f5ff46e33edb4c9cc02d9fe44e5e40d23343  
**Status**: Draft for build-plan review

## Summary

本计划把 WorkflowHub 恢复为不依赖 Multica 的独立产品。WorkflowHub 自己拥有 launcher、canonical task storage、五阶段状态机、认证人工确认、commit/close operation、release pin、routing 和公开 CLI；Multica 只保留在 adapters/multica/，负责认证平台事件、规范化 source、派发公开命令和投影状态。

实施分三层：P0 先完成不可接生产的隔离技术预览；P1 补齐生产资格所需的唯一 execution envelope、组件下沉、非 Multica clean-host 和来源对标；P2 冻结事实包，由用户确认 exact switch plan/hash 后只 CAS 一个 production routing pointer。质量 fail/unknown 原样记录，不自动变成 gate。

minimal-path: P2 — 改造现有 StageContext、TaskKernel、ArtifactDir、snapshot capture 和 close executor；只为缺失的公开 CLI、认证、commit、release/routing 与 adapter port 新增最小模块。

## Accepted Input And Research

- build-spec accepted ref：results/build-spec/accepted.json。
- accepted checkpoint blob：ddc6ae9784ed53a34b391370f9e73b83532c25e1。
- frozen spec content hash：fed12afa8a63299f1e14df2c3ce8f5ff46e33edb4c9cc02d9fe44e5e40d23343。
- 最终恢复方案：/Users/Hugh/Downloads/WorkflowHub-Multica-完整恢复方案-2026-07-16.md，SHA-256 由 spec 冻结为 2fce97424d8aeba8ac8974bfcf03b480be9e88e5f7836af67a3e492ef5f0bc03。
- 研究状态：completed in memory；未创建 research.md 或独立 contract artifact。

### Current-code findings

- 可复用：core/stage-context.mjs、core/task-handle.mjs、core/task-kernel-implementation.mjs 已提供可信 identity、append-only record 和 Workspace/ArtifactDir 能力。
- 可复用改造：core/git-worktree-snapshot.mjs 已有 Git 状态采集骨架，但当前仍调用 commit-tree，必须改成纯 tree/blob/diff snapshot；core/task-close.mjs 已有 plan hash、lock、probe/execute/verify 和 reconcile 骨架。
- 必须替换：scripts/stage-runtime.mjs 和 scripts/task-bootstrap.mjs 仍接受调用方 JSON/file path、target repo path，stdout 也不是统一 envelope。
- 必须迁移：core/git-checkpoint.mjs 仍在 accepted 时物化 commit/ref；这与“阶段只产 tree/blob snapshot”冲突。
- 必须隔离：core/multica-source-adapter.mjs 把 Multica 名称放入 core；应迁到 adapters/multica/，core 只认识 adapter port/source envelope。
- 缺失：独立 commit operation、统一认证 confirmation、immutable release manifest、task release pin、single routing pointer、正式 public CLI 和 P2 switch operation。
- 双定义：contracts/execution-record.contract.json、metrics/execution-record.mjs、metrics/record-schema.mjs 尚未收敛成 execution-record-envelope.v1。
- 可替换组件不足：requirement-ledger、coverage、audit 算法仍在 core，生产前需移动到 components/，core 只校验 version/ref/hash。

## Technical Context

- Language/Version：Node.js ESM；目标 runtime 1.0.0；package 当前占位版本 0.0.0 只在 release phase 一次性切换。
- Primary Dependencies：Node.js 标准库、Ajv 8.17.1、js-yaml 4.1.0；不新增运行时依赖。
- Storage：launcher 从受信配置解析 canonical task storage；设计工件只由 ArtifactDir 管理。
- Testing：Vitest 2.1.9、markdownlint-cli2 0.14.0、npm test、npm run check。
- Target Platform：无 Multica 的 clean host 与可选 Multica adapter。
- Performance Goals：CLI 单次命令只重建一个 task-scoped capability；无额外常驻 registry；release doctor 线性扫描 manifest artifacts。
- Constraints：create-only canonical records；拒绝未知字段；不依赖 cwd；只接 stdin @- 或 launcher-authorized staging ref；质量事实不阻断。
- Scope：P0 技术预览、P1 生产资格、P2 单指针切换；不做自动 merge/push/archive、SBOM/signature gate、多生产 adapter 或质量阈值 gate。

## Global Constraints

- WorkflowHub 必须在无 Multica 环境独立创建 task、运行五阶段、commit、close 和恢复。
- Multica 代码只存在于 adapters/multica/ 及其 fixtures；不得导入 core 内部 writer。
- 只有目标产品仓操作使用认证 Workspace/CandidateWorkspace cwd；doctor、task、release、routing 不依赖 cwd。
- 所有公开命令拒绝 --cwd、--worktree、--storage-root、任意 JSON/file path 和 capability id/object，并在任何副作用前失败。
- JSON 只来自 stdin @- 或 canonical/launcher-authorized staging ref。
- 自动阶段 build-spec/build-code 禁止 human confirmation；make-decision/build-plan/verify-code 必须认证确认。
- stage、commit、close 使用同一 v1 envelope，但 purpose、bound\_ref、bound\_hash 不可交叉复用。
- 阶段只产 canonical tree/blob snapshot；commit 和 close 是独立 plan/hash-bound operation。
- task pin exact release manifest hash；production 只 CAS 一个 routing pointer。
- legacy task-attempt.v2、task-accepted.v2、checkpoint 只读迁移，不重签、不混 lineage。
- P0 不得切 production；P1 六类结构证据齐全后才可提交 P2，质量内容仍由用户裁决。

## Interfaces And Data Contracts

### Public command boundary

- Entry：bin/workflowhub。
- Router：core/public-cli.mjs，命令 allowlist 固定为 doctor、task、stage、commit、close、release、routing 和 admin repin。
- Input：core/json-input.mjs 只允许 @- 或受 launcher capability 验证的 staging ref；最大字节数在 schemas/cli-input.v1.schema.json 固定；任何路径型参数在 bootstrap/capability 创建前拒绝。
- Output：schemas/cli-output.v1.schema.json。stdout 恰好一个 envelope；ok 无 error，error 无 result\_ref。
- Exit codes：0、2、10、11、12、13、14、15、20、30、40，语义按 spec FR-019/020 固定。

### V1 contract set

P0 新增或冻结以下 schema，全部 additionalProperties=false、schema\_version=1.0.0：

- schemas/cli-input.v1.schema.json 与 schemas/cli-output.v1.schema.json。
- schemas/task-create-input.v1.schema.json 与 schemas/task-manifest.v1.schema.json。
- schemas/source-envelope.v1.schema.json 与 schemas/adapter-envelope.v1.schema.json。
- schemas/task-attempt.v1.schema.json、schemas/task-accepted.v1.schema.json、schemas/task-snapshot.v1.schema.json。
- schemas/stage-receipt-input.v1.schema.json 与 schemas/stage-run-input.v1.schema.json。
- schemas/human-confirmation-envelope.v1.schema.json，替代旧 schemas/human-confirmation.v1.schema.json 的非认证形状。
- schemas/task-commit-plan.v1.schema.json、schemas/task-close-plan.v1.schema.json、schemas/task-operation.v1.schema.json。
- schemas/release-manifest.v1.schema.json、schemas/multica-skills-lock.v1.schema.json、schemas/switch-plan.v1.schema.json。
- contracts/contract-set.2026-07-16.1.json 记录 schema id、producer、consumer、exact version、migration 和 fixture hash。

P1 只新增 schemas/execution-record-envelope.v1.schema.json 和 components/*/contract.v1.schema.json；旧 contracts/execution-record.contract.json 保留为 legacy mapping，不再是 writer authority。

### Capability ownership

- core/launcher-authority.mjs 只在进程内从受信 config、canonical ref、task pin 和 release manifest重建能力；不序列化 capability。
- core/stage-context.mjs 继续是 stage 唯一上下文入口；新增 pinned release 验证和 v1 accepted lineage 读取。
- 目标仓读写只经过 Workspace/CandidateWorkspace 与 core/workspace-runner.mjs。
- doctor、task create/status、release、routing 使用各自受信 config/release/task-index 能力，不要求 cwd。

### Snapshot, commit and close

- core/task-snapshot.mjs 从认证 Workspace 生成 task-snapshot.v1：baseline\_commit、tree\_oid、diff\_ref/hash、blob refs/hash、worktree\_status、captured\_at；禁止 commit-tree/update-ref。
- core/task-commit.mjs 提供 prepare/confirm/execute/status；plan 绑定 release、lineage、parent、tree、diff、target ref 和 plan hash；execute 在 lock 内 reread 并 verify postcondition。
- core/task-close.mjs 改为同一 confirmation envelope，plan 每步含 exact precondition/postcondition；仅有独立 final commit 时生成 ancestry step。
- executor 开始后的错误只写 attempt/failure/observation；verify exact postcondition 后才写 completed。

### Adapter port

- adapters/port.mjs 只暴露 normalizeSource、authenticateEvent、dispatch、projectStatus 四个窄方法和版本。
- adapters/multica/index.mjs 实现平台事件回读、stable human identity、公开 CLI 派发和状态投影；不得导入 TaskKernel、canonical writer、coverage/audit/metrics 算法。
- adapters/offline-fixture/index.mjs 实现同一 port，支持 clean-host e2e，不含任何 Multica 字段。
- core/multica-source-adapter.mjs 在迁移窗口只读转发并标 deprecated，P1 clean-host 通过后删除。

## Project Structure

~~~text
bin/
└── workflowhub                                      NEW
core/
├── public-cli.mjs                                   NEW
├── json-input.mjs                                   NEW
├── cli-envelope.mjs                                 NEW
├── launcher-authority.mjs                           NEW
├── human-confirmation.mjs                           NEW
├── task-snapshot.mjs                                NEW
├── task-commit.mjs                                  NEW
├── release-manifest.mjs                             NEW
├── release-routing.mjs                              NEW
├── production-switch.mjs                            NEW
├── stage-context.mjs                                MODIFY
├── stage-runner.mjs                                 MODIFY
├── stage-handlers.mjs                               MODIFY
├── task-kernel-implementation.mjs                   MODIFY
├── task-handle.mjs                                  MODIFY
├── task-close.mjs                                   MODIFY
├── workspace-runner.mjs                             MODIFY
├── git-checkpoint.mjs                               LEGACY READ-ONLY
└── multica-source-adapter.mjs                       LEGACY THEN DELETE
adapters/
├── port.mjs                                         NEW
├── multica/index.mjs                                NEW
├── multica/skills/{orchestrator,make-decision,
│   build-spec,build-plan,build-code,verify-code}/SKILL.md NEW
└── offline-fixture/index.mjs                        NEW
components/
├── requirement-ledger/{index.mjs,contract.v1.schema.json} NEW
├── coverage/{index.mjs,contract.v1.schema.json}     NEW
├── audit/{index.mjs,contract.v1.schema.json}        NEW
└── metrics/{index.mjs,contract.v1.schema.json}      NEW
schemas/
├── cli-*.v1.schema.json                             NEW
├── task-*.v1.schema.json                            NEW
├── source-envelope.v1.schema.json                   NEW
├── adapter-envelope.v1.schema.json                  NEW
├── human-confirmation-envelope.v1.schema.json       NEW
├── release-manifest.v1.schema.json                  NEW
├── multica-skills-lock.v1.schema.json               NEW
├── switch-plan.v1.schema.json                       NEW
└── execution-record-envelope.v1.schema.json         P1 NEW
contracts/
└── contract-set.2026-07-16.1.json                   NEW
scripts/
├── stage-runtime.mjs                                INTERNAL MODIFY
├── task-bootstrap.mjs                               INTERNAL MODIFY
├── build-release.mjs                                NEW
├── migrate-task-v2.mjs                              MODIFY
├── run-isolation-canary.mjs                         NEW
└── run-fault-injection.mjs                          NEW
tests/
├── public-cli-contract.test.mjs                     NEW
├── public-cli-side-effect-rejection.test.mjs        NEW
├── stage-lineage-v1.test.mjs                        NEW
├── human-confirmation-envelope.test.mjs             NEW
├── task-snapshot.test.mjs                           NEW
├── task-commit.test.mjs                             NEW
├── task-close-v1.test.mjs                           NEW
├── adapter-port.test.mjs                            NEW
├── release-manifest.test.mjs                        NEW
├── release-routing.test.mjs                         NEW
├── legacy-v2-migration.test.mjs                     NEW
├── execution-envelope-v1.test.mjs                   P1 NEW
├── clean-host-e2e.test.mjs                          P1 NEW
└── production-switch.test.mjs                       P2 NEW
~~~

Structure decision：复用现有 core 的可信能力与 record primitive；Multica 放入 adapters/multica/；算法放入 components/；schema 集中于 schemas/；只保留一个 bin/workflowhub。不会复制六份 runtime。

## Implementation Phases

### Phase 0 — Baseline freeze and RED contracts

1. 固定当前 HEAD、accepted spec hash、P0 contract set 和 legacy fixtures；先写 CLI/path/auth/snapshot/release 的 RED tests。
2. 为每个新 schema 建 closed-object fixture；冻结 v1 与 legacy v2 的兼容矩阵。
3. 运行 npm test 与 npm run check 取得 baseline；既有失败如实记录，不作为伪 PASS。

完成条件：所有新增测试因目标能力缺失而 RED，且不是 fixture/语法错误。  
Maps to：FR-001—006、FR-007—020、FR-021—034、NFR-004/006。

### Phase 1 — P0-A trusted launcher and public CLI

1. 新建 bin/workflowhub、public-cli/json-input/cli-envelope/launcher-authority；旧 scripts 只成为内部 handler。
2. task create 在 create lock 内解析 routing pointer、doctor release、pin manifest；task/status/doctor/release/routing 不读取 cwd。
3. 所有命令先完成 argv allowlist、unknown-field 和 JSON source admission，再调用 assertRuntimeAuthority/bootstrap/doctor 或创建任何 lock/temp；随后完成 identity/schema 校验，才可创建 execution/task/workspace/receipt/confirmation/operation。这样非法输入不会因 runtime authority 首次初始化而产生副作用。
4. 用受信 project repo registry 把 canonical target repository ref 解析成路径；公开 task create 不接 target repo path 或 release pin。

失败恢复：解析或授权错误不留 record；immutable conflict 返回 14；外部暂不可用返回 20。  
验收证据：CLI envelope fixtures、cwd/path 注入矩阵、before/after task storage snapshot。  
Maps to：FR-001—006、FR-016—020、AC-011/012/021。

### Phase 2 — P0-A five-stage truth, authenticated confirmation and snapshot

1. 将 task-attempt/task-accepted writer 收敛到 v1，并验证 exact upstream ref/hash；未来 stage 无 accepted upstream 时不可执行。
2. 用 human-confirmation-envelope.v1 替换纯 decision record；launcher-issued platform verifier 或 signature verifier 回读 actor/event/permission，source event create-only consume。
3. 固定 acceptance policy：make-decision/build-plan/verify-code human；build-spec/build-code automatic；rejected/timeout exit 0 且不 accept。
4. 用 task-snapshot.v1 替换新任务的 git checkpoint；阶段不得调用 commit-tree/update-ref，accepted 只绑定 tree/blob/diff facts。

失败恢复：stage publish 后崩溃可重开同一 task；不搜索 latest、不推断 identity；旧 v2/checkpoint 仅交给 legacy reader。  
验收证据：五阶段 e2e、跨 task/hash/skip negative tests、Git refs before/after、伪 actor/event replay tests。  
Maps to：FR-007—015、FR-021/023、AC-003—007。

### Phase 3 — P0-A independent commit, close and adapter isolation

1. 实现 commit prepare/confirm/execute/status；prepare 无 Git 副作用，execute 锁内重读 parent/tree/diff/ref/release/lineage。
2. 改造 close plan：每步 exact pre/post、retry reread、postcondition reconcile、第三状态 exit 15；cleanup 不阻断逻辑完成。
3. stage、commit、close 共用认证 envelope，但 purpose 与 bound ref/hash严格隔离。
4. 把 Multica source 代码迁到 adapters/multica/，core 只依赖 adapter port；增加 offline fixture adapter。

失败恢复：executor failure 写 failure/observation；崩溃重试只在 postcondition 精确满足时 reconcile；无 final commit 不生成 ancestry step。  
验收证据：commit live invalidation、close crash matrix、confirmation cross-use、双 adapter contract suite。  
Maps to：FR-012—015、FR-022—028、FR-038、AC-002/005/008—011。

### Phase 4 — P0-B immutable release and isolated preview

1. 先实现 build-release 与 doctor 的早期 scaffold，只用受控 fixture 验证 artifacts → manifest → sidecar 的无自引用顺序；此时不宣称已冻结最终发行。
2. doctor 校验 sidecar、所有 artifact hash、Skill hash、adapter、lock、runtime exact version 和 contract set。
3. task manifest pin exact release hash；在途 task 始终读 pin。routing 只保存 manifest hash并用 CAS 更新。
4. 无单 pointer adapter 只提供 quiesce/drain/整体切换，不提供逐项热替换。
5. 在 T020 scaffold 完成后，以真实 runtime 1.0.0、六薄 Skill、真实 Multica adapter、exact lock 组装并 doctor 一个 immutable P0 preview release，再用它跑两次 fresh Canary、故障注入和回滚演练；P0 production switch 必须拒绝。最终生产候选仍要等 Phase 6 的 P1 内容与 S3/S6 元数据稳定后重新构建、doctor 并冻结。

失败恢复：坏 release 保持 inactive；pointer 未动；Canary 修复后两次计数归零。  
验收证据：release hash mutation matrix、task pin old/new fixture、P0 switch rejection、两次独立 Canary refs。  
Maps to：FR-002/003、FR-029—034、FR-041、AC-012—015/018—020。

### Phase 5 — P1-A production records and replaceable components

1. 以 execution-record-envelope.v1 作为唯一 canonical writer；迁移旧 contracts/execution-record.contract.json、metrics/execution-record.mjs 和 metrics/record-schema.mjs 为 validator/projection。
2. launcher create-only 建 skeleton；owner 在 task lock/CAS 下只更新自己的字段；unknown metrics 使用 gap+reason。
3. 把 requirement ledger、coverage、audit、metrics 计算迁到 components/，输入输出都带 schema/version/ref/hash；core 只校验 envelope。
4. legacy execution/metrics 原文和 hash 保留，生成 migration report，不原地重写。

失败恢复：metrics/provider 失败记录 gap/unavailable；不阻断结构有效的业务流程。  
验收证据：单 schema writer scan、owner conflict tests、gap tests、component swap tests、legacy replay report。  
Maps to：FR-035—037、FR-042、AC-016/017/018。

### Phase 6 — P1-B portability and source decisions

1. 按 isolated-browser-qa skill 完成当日 upstream URL/version/checked\_at/local delta 调查，形成保留/升级/替换裁决记录。
2. 对 orchestrator 幂等恢复和 plan-bound deployment approval 固定成熟来源、版本、checked\_at 和 local delta。
3. 验证六薄包不含 runtime、业务路径、canonical writer 或其他 stage 能力。
4. S3/S6 元数据与 P1 execution/components/migration 内容稳定后，使用真实 runtime、六薄 Skill、Multica adapter、exact lock 重跑 release build 和 doctor，冻结最终 manifest/sidecar hash。
5. 最终发行冻结后，在完全不安装/连接 Multica 的 clean host 用 offline adapter 创建 task、跑五阶段测试链并读取 canonical result。
6. 用同一 adapter suite 验证 Multica/offline；扫描 core、contracts、canonical records 无平台私有字段。P1 eligibility 与 production fact packet 只能引用上述最终发行和 clean-host evidence。

失败恢复：来源不可用记 unknown；不伪造检查完成；缺任一结构证据时 production eligibility=false。  
验收证据：clean-host result、adapter suite、S3/S6 decision refs、skill closure scan。  
Maps to：FR-038—040、FR-042、NFR-001/002、AC-001/002/018/020。

### Phase 7 — P2 exact production switch

1. 先完成切换前 requirement coverage、host-independence scans、targeted/full tests 和 evidence freeze，再冻结实现 snapshot、两次 fresh Canary、故障注入、回滚和独立 review evidence；review evidence 可以是 canonical result ref，也可以是 provider unavailable/unknown diagnostic ref，失败/unknown 不裁剪且不构成成功硬门。
2. production eligibility 只检查必需结构与安全合同是否存在、可解析、身份/hash/version/auth是否有效，不检查质量阈值。
3. 生成 switch-plan.v1，绑定 old/new manifest hash、pointer live value、事实包 hash、rollback target；用户认证确认 exact plan/hash。
4. CAS 唯一 pointer，观察首个生产 task；失败只回滚到上一 approved compatible manifest，否则停用入口。

失败恢复：CAS conflict 不产生 completed；无安全 rollback 时 quiesce/disable，保留 task/worktree/records。  
验收证据：切换前资格验证 ref、最终 release manifest/doctor ref、switch confirmation、CAS observation、切换后首任务/rollback observation，以及独立 review result 或 unavailable/unknown diagnostic ref。  
Maps to：FR-032—034、FR-043、AC-014/015/017—019。

## Test Strategy

### Fast contract lane

- npx vitest run tests/public-cli-contract.test.mjs tests/public-cli-side-effect-rejection.test.mjs
- npx vitest run tests/stage-lineage-v1.test.mjs tests/human-confirmation-envelope.test.mjs
- npx vitest run tests/task-snapshot.test.mjs tests/task-commit.test.mjs tests/task-close-v1.test.mjs
- npx vitest run tests/adapter-port.test.mjs tests/release-manifest.test.mjs tests/release-routing.test.mjs

### Migration and compatibility lane

- npx vitest run tests/legacy-v2-migration.test.mjs scripts/\_\_tests\_\_/migrate-task-v2.test.mjs
- 断言 legacy 原文/hash 未变、v1/v2 lineage 不混用、checkpoint 不能授权新 commit/close。

### Production-qualification lane

- npx vitest run tests/execution-envelope-v1.test.mjs tests/clean-host-e2e.test.mjs tests/production-switch.test.mjs
- node scripts/run-isolation-canary.mjs --mode=fresh，连续两次不同 task/worktree/execution。
- node scripts/run-fault-injection.mjs，覆盖 stage publish、confirmation consume、commit/close execute 和 projection failure 窗口。

### Full repository lane

- npm test
- npm run check
- git diff --check
- 扫描 bin/core/components/skills/adapters 的 host path、Multica import、writer import 和 forbidden CLI flag。

所有命令保存 command、exit code、stdout/stderr hash、snapshot tree 和 canonical evidence ref。fail/unknown 可进入用户 brief；身份、schema、hash、auth、permission、version、immutable conflict 则 fail-loud。

## Migration Plan

1. 先发布 v1 reader/writer 和 contract set；新 task 只写 v1。
2. scripts/migrate-task-v2.mjs 拆为 admin repin/migration prepare 与 execute：公开入口只收 canonical task/release refs，内部 sidecar 才接 launcher-authorized source ref。
3. prepare 冻结 legacy task-attempt.v2、task-accepted.v2、checkpoint/execution/metrics 原始 hash和目标 v1 plan hash；不修改旧记录。
4. 用户用 purpose=admin-repin 的独立受信 confirmation 授权；execute 锁内重读 old pin/live state，create-only 写 migration report 和新 pin。失败保留旧 pin。
5. core/git-checkpoint.mjs、schemas/task-*.v2.schema.json 和旧 execution contract 只读保留一个 sunset 窗口；禁止 fallback 写入。
6. P1 clean-host、legacy replay、两次 Canary 完成后删除 core/multica-source-adapter.mjs 写路径与旧 writer exports；保留 reader/fixture。

## Failure Recovery

- 输入/argv/schema/canonical ref 错：无 task、workspace、receipt、attempt、confirmation、operation 副作用。
- accepted publish 前崩溃：重开相同 task 和 attempt；不 search latest。
- source event consume 后崩溃：create-only consume key 使重放返回同一 confirmation 或 immutable conflict，不再认证第二次。
- commit/close execute 后崩溃：lock 内 probe live postcondition；精确满足才 reconcile completion，否则 exit 15。
- release doctor 失败：保持 inactive，不改 pointer；task create 不落 manifest。
- CAS conflict：重新生成 switch plan并重新确认，不复用旧授权。
- rollback target 不安全：停用入口，保留 canonical facts 和 worktree，不恢复已知坏配置。

## Requirement And Evidence Mapping

- FR-001—006 → Phase 1；AC-012/021；CLI injection storage diff、Workspace/ArtifactDir tests。
- FR-007—011 → Phase 2；AC-003/004/007；five-stage lineage e2e。
- FR-012—015 → Phase 2/3；AC-004—006；authenticated event replay/cross-purpose tests。
- FR-016—020 → Phase 1；AC-011/021；envelope/exit-code/zero-side-effect matrix。
- FR-021—028 → Phase 2/3；AC-007—011；Git refs, commit invalidation, close crash matrix。
- FR-029—034 → Phase 4/7；AC-012—015/019/020；manifest mutation, pin, CAS, rollback facts。
- FR-035—037 → Phase 5；AC-016/017；single writer, gap, component swap facts。
- FR-038—040 → Phase 3/6；AC-001/002；clean-host, adapter suite, S3/S6 decision refs。
- FR-041—043 → Phase 4—7；AC-018/019；P0 reject, P1 evidence completeness, exact switch confirmation。

## Exact Traceability Index

- Phase 1：FR-001、FR-002、FR-003、FR-004、FR-005、FR-006、FR-016、FR-017、FR-018、FR-019、FR-020；AC-011、AC-012、AC-021。
- Phase 2：FR-007、FR-008、FR-009、FR-010、FR-011、FR-012、FR-013、FR-014、FR-015、FR-021、FR-023；AC-003、AC-004、AC-006、AC-007。
- Phase 3：FR-012、FR-013、FR-014、FR-015、FR-022、FR-023、FR-024、FR-025、FR-026、FR-027、FR-028、FR-038；AC-002、AC-005、AC-008、AC-009、AC-010、AC-011。
- Phase 4：FR-002、FR-003、FR-029、FR-030、FR-031、FR-032、FR-033、FR-034、FR-041；AC-012、AC-013、AC-014、AC-015、AC-018、AC-019、AC-020。
- Phase 5：FR-035、FR-036、FR-037、FR-042；AC-016、AC-017、AC-018。
- Phase 6：FR-038、FR-039、FR-040、FR-042；AC-001、AC-002、AC-018、AC-020。
- Phase 7：FR-032、FR-033、FR-034、FR-043；AC-014、AC-015、AC-017、AC-018、AC-019。

## Constitution Check

### Framework Principles

- [x] F1 薄核心 — core 保留 identity/state/hash/capability；ledger/coverage/audit/metrics 下沉 components。
- [x] F2 窄契约 — CLI、adapter、component、confirmation、operation 全部 closed v1 schema。
- [x] F3 物理事实机器校验但不阻断 — snapshot/Canary/test 原样记录，质量结果不自动 gate。
- [x] F4 异源审查与人 — build-plan 与 P2 均要求独立 review ref，最终由用户确认。
- [x] F5 gate 谨慎添加 — hard reject 仅限 spec 列出的结构、身份、hash、auth、权限、version、immutable conflict。
- [x] F6 统一外置执行记录 — P1 收敛为 execution-record-envelope.v1，旧定义只读。
- [x] F7 不自动越过人 — 三个 stage gate、commit、close、repin、switch 各自 exact plan/ref/hash。
- [x] F8 简单优先 — 一个 runtime、一个 CLI、一个 manifest、一个 pointer；复用现有能力。
- [x] F9 可证伪不假绿 — exit code、fail、unknown、gap、原始 evidence 可查询。
- [x] F10 收益优先 — 不做 SBOM/signature gate、自动质量 gate、多生产 adapter、自动 merge/push/archive。

### Quality Principles

- [x] Q1 记事实而非阻断 — review/test/coverage/Canary fail/unknown 进入 brief。
- [x] Q2 gate 三类划分 — 入口 hard check、事实采集、人工确认分开。
- [x] Q3 异源审查加人工 — 计划只声明独立 review 输入，不自审自判。

### Skill Principles

- [x] S1 外部优先 — 复用现有 vendored skills 和固定来源。
- [x] S2 合宪改造 — local delta 进入 catalog/decision record。
- [x] S3 保持最新 — P1 明确 isolated-browser-qa 当日 upstream 裁决任务。
- [x] S4 指标 — P1 唯一 envelope 记录每个自研 skill/stage 的最小 metrics/gap。
- [x] S5 子代理友好 — 组件只接 frozen content 与窄 refs。
- [x] S6 成熟方案对标 — P1 固定 orchestrator/deployment 对标来源与差异。
- [x] S7 一阶段一目录 — 保留 workflows/<stage>/；Multica 六包只作薄入口。
- [x] S8 独立可搬运 — offline adapter clean-host 是生产资格证据。

Constitution Check Result：21/21 在计划中有明确落实路径；这只是作者侧设计对照，不代替独立质量裁决。

## Complexity And F10 Decisions

- Public CLI：P3 KEEP。现有 scripts 不是公开合同，且路径输入已形成真实边界问题；新增一个 router 而非多个 CLI。
- Unified confirmation：P3 KEEP。现有 stage/close confirmation 形状分裂且未认证；一个 envelope 减少重复。
- Snapshot replacement：P2 KEEP。复用 git-worktree-snapshot，删除阶段 commit/ref 物化，不另建 VCS abstraction。
- Commit/close operation：P2/P3 KEEP。close 改造复用现有 executor；commit 是缺失的独立授权边界。
- Release/routing：P3 KEEP。真实防止 runtime/Skill 部分更新；只用 SHA-256、manifest、sidecar、单 pointer。
- Execution envelope：P2 KEEP，放 P1。收敛两个旧定义，不新增平行遥测系统。
- Offline adapter：P3 KEEP。只做一个 fixture adapter证明 port，不维护第二生产平台。
- SBOM/signature、质量阈值 gate、全量 dashboard：PRUNE，当前无足够收益证据。

## Scope Boundary

不得把 runtime 复制进 Multica 或六个 Skill 包；不得让 adapter 导入 TaskKernel/canonical writer；不得把平台 Issue 当事实源；不得自动 merge、push、archive、删分支；不得在 P0 CAS production pointer；不得用 quality fail/unknown 代替 hard eligibility；不得修改已 accepted 的 spec.md。plan.md 与 tasks.md 是本阶段唯一设计写入。
