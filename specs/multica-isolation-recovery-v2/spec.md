# WorkflowHub × Multica 隔离恢复规格

## 1. 文档状态

- Task：workflowhub/multica-isolation-recovery-v2
- 规格状态：Draft for build-spec review
- 上游决策：results/make-decision/accepted.json
- 上游 decision receipt：receipts/decision.json
- 恢复方案 SHA-256：2fce97424d8aeba8ac8974bfcf03b480be9e88e5f7836af67a3e492ef5f0bc03
- 核心产品边界：WorkflowHub 必须可脱离 Multica 独立运行；Multica 只是可选 platform adapter。

## 2. 目标

恢复 WorkflowHub 与 Multica 的正确产品边界，消除跳阶段、伪人工确认、内部 runtime 泄漏、close 无公开入口和运行记录分裂问题。交付后，WorkflowHub 五阶段流程可由自身 launcher、task storage、CLI、Skills 和 contracts 独立执行；Multica 只负责平台事件规范化和派发。

## 3. 用户结果

1. 用户可在没有 Multica 的环境中创建并完成 WorkflowHub 标准任务。
2. 用户在 Multica 中看到的流程与 WorkflowHub canonical task 状态一致，不会由 Agent 文本声明伪造。
3. 用户只在方向、实施计划、最终验证三个阶段边界确认；commit 和 close 分别使用独立授权。
4. 用户可查看失败、未知、审查、Canary 和恢复事实，不会看到假 PASS。
5. 维护者只维护一套 runtime、一个公开 CLI、一个 adapter port 和版本化窄合同。

## 4. 范围

### 4.1 包含

- host-independent WorkflowHub orchestration core 与可替换组件边界。
- Multica adapter port 和非 Multica clean-host fixture。
- canonical task、CandidateWorkspace、Workspace、artifact 和 execution record。
- 五阶段顺序、接受策略和上下游 lineage。
- 认证 human confirmation envelope。
- task、stage、commit、close、doctor、status 的公开 CLI 合同。
- tree/blob snapshot、独立 commit operation、幂等 close state machine。
- immutable release manifest、exact lock/version、task pin、single routing pointer。
- legacy v2/checkpoint 只读迁移。
- P0 隔离技术预览、P1 生产前能力、P2 用户确认切换。

### 4.2 不包含

- Multica 产品内部架构重写。
- 把 WorkflowHub core/runtime 复制或内嵌进 Multica。
- 自动 merge、push、archive、删除分支或未独立授权的 cleanup。
- 自动质量阈值 gate。
- P0 强制 SBOM、制品签名或 signing-key 服务。
- 多平台生产 adapter；本任务只要求一个非 Multica fixture 证明可替换性。

## 5. 架构不变量

### INV-001 独立产品

WorkflowHub 的 task 创建、五阶段执行、证据、人工确认、commit、close 和恢复不得依赖 Multica API、Issue、comment、Agent 或路径。

### INV-002 薄 adapter

Multica adapter 只能读取平台对象、认证平台事件、规范化 source、调用公开 CLI 和回写展示状态；不得计算 coverage/audit、写 accepted result、制造人工确认、推断 storage path 或导入 core 内部模块。

### INV-003 薄 core

Core 只负责编排、状态转换、identity、lineage、schema、hash 和 capability 校验。ledger、coverage、audit、metrics 计算必须位于可替换、版本化组件中。

### INV-004 单一事实源

Canonical task storage 是状态与证据的唯一事实源。Multica Issue 是交互投影，不得覆盖冻结记录。

### INV-005 质量事实不自动阻断

测试、review、coverage、Canary、故障注入和指标的 pass、fail、unknown 原样记录并交给用户；只有结构、身份、lineage、hash、认证、权限、版本和 immutable conflict 可在副作用前 hard reject。

## 6. 功能需求

### 6.1 Task、Workspace 与 Artifact

- FR-001：Launcher 必须从受信全局配置解析 canonical storage root，并派生 Projects/<project>/tasks/<task>；调用方不得传 storage root 或 task path。
- FR-002：Task create 必须在 create lock 内读取 current release pointer、执行 doctor、把 exact release manifest hash create-only 写入 task manifest；输入不得包含 release pin。
- FR-003：恢复或迁移 task pin 必须使用管理员专用 prepare/execute 命令、冻结 plan/hash 和独立人工确认；失败保留旧 pin。
- FR-004：make-decision 接受前只能使用认证 CandidateWorkspace；接受后由 accepted decision 构造认证 Workspace。
- FR-005：只有读取、写入或执行目标产品仓的命令必须在认证 Workspace/CandidateWorkspace cwd 执行；doctor、task create/status、release 和 routing 命令使用各自受信能力且不得依赖 cwd。CLI 不接受调用方提供的 cwd、worktree、baseline 或跨进程 capability id。
- FR-006：设计产物必须通过 ArtifactDir named callbacks 读写 specs/<task>/ 下的 spec.md、plan.md、tasks.md；组件不得拼接路径。

### 6.2 五阶段真实性

- FR-007：Canonical 顺序必须是 make-decision → build-spec → build-plan → build-code → verify-code；每个 attempt/accepted record 必须绑定同 task 的 authentic upstream ref/hash。
- FR-008：make-decision、build-plan、verify-code 使用 human acceptance；build-spec、build-code 自动推进和自动接受。
- FR-009：build-code 的内部 Phase 不得增加人工确认。
- FR-010：Agent、orchestrator 或 adapter 不得直接写 attempt、accepted 或 confirmation；只能调用公开入口，由 TaskKernel 写 canonical record。
- FR-011：未来阶段必须保持未分配且不可执行；当前阶段完成由 canonical accepted record 驱动，不由自然语言声明驱动。

### 6.3 人工确认

- FR-012：Stage、commit、close 必须使用同一版本化 confirmation envelope，但 purpose 和 bound ref/hash 必须不同且不可交叉复用。
- FR-013：Confirmation 必须包含 stable human actor、source event、occurred_at、认证方法和 verified_at；系统必须通过平台 capability 回读或受信签名验证，不信任 Agent 自报字段。
- FR-014：同一 source event 只能消费一次。Stage 只允许 accepted、rejected、timeout；commit/close 只允许 confirmed、rejected、timeout。
- FR-015：rejected/timeout 是成功记录的人工事实，返回正常结果但不得产生 accepted record 或物理 operation。

### 6.4 公开 CLI

- FR-016：公开 CLI 必须覆盖 doctor、task create/bootstrap/status、stage prepare/receipt/run/confirm/accept、commit prepare/confirm/execute/status、close prepare/confirm/execute/status。
- FR-017：JSON payload 只允许从 stdin `@-` 或 canonical/launcher-authorized staging ref 读取；禁止任意调用方文件路径。CLI 只接受 canonical task/stage/release/source/artifact refs 和 enum，不得接受 shell string、任意 cwd、worktree、storage path 或可复用 capability。
- FR-018：每个进程必须从 canonical refs 和受信本机配置重建 authentic capability，结束后销毁，不输出 capability id/object。
- FR-019：Stdout 必须是单个 versioned JSON envelope。status=ok 时省略 error；status=error 时省略 result_ref。错误码必须区分 usage、schema、identity/lineage/hash、auth/capability、release、immutable conflict、授权失效、外部暂不可用、executor failure 和 internal error。
- FR-020：入口或授权错误不得写任何成功状态。物理 executor 开始后失败可写 immutable attempt/failure/observation/reconciliation facts，但不得写 completed。

### 6.5 Snapshot、Commit 与 Close

- FR-021：所有阶段只产生 canonical tree/blob snapshot，包含 baseline commit、tree、diff/blob refs+SHA-256、worktree status、captured_at；不得自动 git commit、commit-tree 或移动 ref。
- FR-022：Commit 必须是独立 operation，plan 绑定 task、release、accepted lineage、parent OID、candidate tree、diff hash、target ref 和 plan hash，并取得独立人工授权。
- FR-023：Verify-code 确认只接受验证事实，不授权 commit、merge、push、archive 或 cleanup。
- FR-024：Close plan 必须为每个 step 冻结 exact authorized precondition/postcondition、accepted lineage、confirmation 和 pinned release。
- FR-025：Close 首次执行仅在 live state 等于 precondition 时执行；崩溃重试若等于 postcondition，只 verify 并 reconcile completion；两者均不匹配时返回授权失效，不执行副作用。
- FR-026：每次 close retry 都必须在同一 operation lock 内重读 lineage、confirmation、release 和 live Git state。
- FR-027：只有任务执行过独立 final commit 时才可生成 final commit ancestry step；无 commit 不生成，legacy checkpoint ancestry 仅迁移读取。
- FR-028：Cleanup 不是逻辑完成前提；未授权 cleanup 不得让已验收任务永久 blocked。

### 6.6 Release 与 Routing

- FR-029：一次发行必须包含一个 runtime archive、六个薄 Skill 包、一个 adapter、exact lock 和位于 artifacts 外的 immutable release manifest/sidecar hash。
- FR-030：Release hash 顺序必须避免自引用：先 hash artifacts，再生成 canonical manifest，再把 manifest SHA-256 写入外置 sidecar；manifest 不含自身 hash。
- FR-031：Doctor 必须验证 manifest sidecar、artifact/Skill/adapter/lock SHA-256、exact runtime version 和 contract set；P0 不以 SBOM/signature 为 hard eligibility。
- FR-032：Production 只能 CAS 一个 routing pointer，值为 release manifest hash。Task 创建时 pin 当前 manifest；在途 task 始终使用自身 pin。
- FR-033：平台没有单原子 pointer 时，必须 quiesce 新任务并 drain/暂停在途任务后整体切换，不得逐配置项热替换。
- FR-034：回滚只能指向上一已批准且仍兼容的 release manifest；没有则停用入口，不恢复已知坏旧配置。

### 6.7 Execution、Metrics 与可替换组件

- FR-035：生产前必须只有一个 canonical execution envelope，记录 execution/task/producer/release/timing/status/facts/metrics/decisions/refs/integrity；旧双定义只读迁移。
- FR-036：最小 metrics 必须记录 duration、tokens、rework、human intervention 和 friction；未知值必须带 gap 原因，不伪造零。
- FR-037：Ledger、coverage、audit、metrics 组件必须有窄版本化输入输出；core 只验证 envelope identity/version/hash/ref，不复制计算算法。
- FR-038：必须提供非 Multica clean-host fixture，证明同一 generic adapter contract 可在无 Multica 环境运行，且平台字段不泄漏进 core。
- FR-039：必须完成 isolated-browser-qa 当日 upstream 检查与保留/替换裁决，并记录来源、版本、checked_at 和 local delta。
- FR-040：必须完成 orchestrator 幂等/恢复与 plan-bound deployment approval 的成熟方案对标并记录固定来源、版本和差异。

### 6.8 上线阶段

- FR-041：P0-A/P0-B 只能用于隔离技术预览，不得 CAS production pointer 或接生产任务。
- FR-042：P1 必须完成唯一 execution envelope、最小 metrics、组件下沉、非 Multica fixture、S3 更新裁决和 S6 对标结构证据，才具备进入 P2 的结构资格；证据内容的质量结论仍由用户裁决。
- FR-043：P2 必须冻结实现、测试、Canary、故障注入、回滚和独立审查事实包，由用户对 exact switch plan/hash 确认后才能 CAS production pointer。

## 7. 验收标准

- AC-001：在不安装、不连接 Multica 的 clean host fixture 中，可创建 task、运行五阶段测试链并读取 canonical results；证明 WorkflowHub 独立运行。
- AC-002：Multica adapter contract test 证明它只规范化、认证和派发；尝试写 accepted、计算 coverage 或传平台私有字段时失败。
- AC-003：跳过任一上游阶段、跨 task ref、错误 hash 或伪造 accepted record，在副作用前被拒绝。
- AC-004：make-decision/build-plan/verify-code 缺 authentic human confirmation 时不能接受；build-spec/build-code 传 confirmation 时被拒绝。
- AC-005：Verify confirmation 不能用于 commit/close；Stage、commit、close 任意 ref/hash/purpose 交叉使用均被拒绝。
- AC-006：伪造 actor_type、复用 source event、未认证 comment 或 Agent 自称“用户已批准”不能产生 confirmation。
- AC-007：自动阶段执行前后 Git refs 完全一致，只新增 canonical snapshot/artifact/records。
- AC-008：独立 commit plan 的 parent/tree/diff/ref 任一变化使旧授权失效，且不创建 commit。
- AC-009：Close 首次从 exact precondition 完成；在 execute 后崩溃的重试从 exact postcondition reconcile，不重复副作用；第三种状态返回授权失效。
- AC-010：没有 final commit 的任务 close plan 不含 ancestry step；legacy checkpoint 只读迁移且不能授权新操作。
- AC-011：入口/授权错误没有 success/completed record；物理 executor failure 只有 attempt/failure facts，验证 postcondition 前没有 completed。
- AC-012：Task create 输入含 release pin 时失败；正常 create 在锁内 pin doctor 通过的 current manifest。
- AC-013：Release manifest hash 计算无自引用；修改任一 artifact、lock、adapter、Skill 或 manifest 后 doctor 失败。
- AC-014：Production 切换只改变一个 routing pointer；无单 pointer 的 fixture 必须证明 quiesce/drain 后才整体切换。
- AC-015：在途 task 在 pointer 切换后继续使用原 manifest，新 task 使用新 manifest；未经 privileged repin 不跨 release。
- AC-016：Execution record 只有一个 canonical schema；最小 metrics 缺值时记录 gap，不阻断业务流程也不假造数据。
- AC-017：Review/test/Canary/coverage 的 fail/unknown 原样进入 facts 和用户 brief，不触发自动质量 gate，不显示总体 PASS。
- AC-018：P0 尝试生产切换被拒绝；P1 六类结构证据缺任一项时不具备 P2 资格；证据内容由用户 exact switch plan 确认裁决。
- AC-019：回滚只能选择上一已批准 compatible manifest；无可用发行时入口停用且 task/worktree/records 保留。
- AC-020：六个 Skill 包不含 runtime 副本、业务仓路径、canonical storage writer 或其他阶段执行能力。
- AC-021：向任一公开 CLI 传入调用方 cwd、worktree、storage path 或任意 JSON/file path 时，必须在创建 task、workspace、receipt、attempt、confirmation、operation 等任何副作用前拒绝；stdin `@-` 与 canonical/launcher-authorized staging ref 除外。

## 8. 边界与异常场景

- 平台 comment 已写但 mention/assignment 失败：保持当前 canonical stage，记录 dispatch failure，不声称已触发。
- Agent 完成但平台状态回写失败：canonical record 保持事实源，平台投影可重试。
- 人工事件到达后进程崩溃：source event 的消费与 confirmation create-only 语义不得产生重复确认。
- Stage publish 后 accept 前崩溃：重开相同 task/context，禁止推断新 identity 或跨 attempt 接受。
- Runtime/Skill/adapter/lock 部分更新：doctor 失败，不能混合运行。
- Review provider、metrics 或 Multica API 暂不可用：记录 unavailable/gap；结构仍有效时不伪装质量结论。
- Worktree、branch、realpath、inode、baseline 或 snapshot 改变：authentic Workspace 校验失败，不做路径 fallback。

## 9. 非功能要求

- NFR-001 可维护性：P0 长期对象限制为一套 runtime、一个 manifest、一个 lock、一个 pointer、六薄包、一个 adapter、一个 CLI、一个 v1 contract set。
- NFR-002 可搬运性：Skill 只依赖公开 CLI、canonical refs 和显式 contracts，不依赖 Multica 私有路径。
- NFR-003 可恢复性：所有副作用 operation 使用 lock、probe/execute/verify、create-only facts 和 exact pre/post state。
- NFR-004 可证伪性：错误 exit code、unknown/gap 和原始 facts 必须可查询；禁止 catch-all PASS 或静默降级。
- NFR-005 最小权限：capability 只在 launcher 进程内重建，不跨进程传输或持久化。
- NFR-006 兼容性：P0 新记录统一完整 v1 schema id/version；legacy v2 只读迁移，禁止混用 lineage。

## 10. 需求追踪

- 方案第 5、9、12 节 → FR-007 至 FR-028。
- 方案第 6、8 节 → INV-001 至 INV-004、FR-038。
- 方案第 7、11 节 → FR-029 至 FR-034、NFR-006。
- 方案第 10、13、15 节 → FR-035 至 FR-043。
- 用户边界“WorkflowHub 可脱离 Multica 独立运行” → INV-001、FR-038、AC-001。

## 11. 澄清记录

- CL-001：WorkflowHub 是独立产品；Multica 是可选 adapter，不是 runtime owner。
- CL-002：P0 是不可接生产的技术预览；生产前能力放在 P1，不允许欠账上线。
- CL-003：质量 facts 不自动 gate；缺少生产必需结构证据与质量结果为 fail 是不同概念。
- CL-004：Commit 与 close 都不能复用 verify-code 确认。
- CL-005：无 final commit 时不生成 ancestry step。
- CL-006：本规格未发现需要用户补充才能确定范围或验收的材料歧义；后续实现若改变上述边界，必须返回 build-spec 重新修订。
