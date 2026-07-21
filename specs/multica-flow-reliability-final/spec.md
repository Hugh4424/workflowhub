# WorkflowHub × Multica 流程可靠性修复规格

## 1. 目标

修复 ZHI-102、ZHI-184 已经发生的 runner 自托管递归、自动阶段停顿、review/receipt 死结、verify 返工断链、交接缺失、人工升级错误、close 长尾和 Issue 状态未收口，使符合 WorkflowHub 目标仓合同的项目能在 Multica 中顺畅执行五阶段。

“顺畅”使用行为事实判断：无无界长轮询；同一业务问题最多一次初审和一次修订复审；无重复业务测试或重复 mention；下游不重复询问已确认输入；只在既有人工边界要求用户操作；完整 close 和最终状态清理成功。不设置任意 token 或时长硬门。

## 2. 系统边界

- WorkflowHub 只负责宿主无关的 stage、attempt/accepted/checkpoint、review/test facts、Workspace、handoff、verify 返工和 close。
- WorkflowHub 源码、Skill 和运行时不得包含 Multica API、Issue、mention、status、generation 或队列逻辑。
- Multica 只通过现有 Skill、Agent/Squad instructions、Issue、stage barrier、status、mention 和 metadata 调用 WorkflowHub；不要求 WorkflowHub 依赖 Multica。
- 先用一个外部小项目 Canary 验证。全过程不修改 ZHI-102、ZHI-184，也不宣称所有项目类型已实证通过。

## 3. 功能要求

### WorkflowHub

- **FR-001 基线整理**：实施必须从本地稳定 `main` 的独立 worktree 开始，审计 local main、origin/main 和 detached 事故提交，只移植必要且验证过的修复，禁止整串合并事故 commits。
- **FR-002 runner 身份**：task 启动时接收宿主无关的 `runner_root/runner_oid`，每个 stage 写入前回读实际 OID；不一致时按身份错误 fail-loud。显式技术 migration 才能更新记录，candidate Workspace 不得充当 runner。
- **FR-003 自动接受**：build-spec、build-code 的 `run` 必须在发布 attempt 后调用现有接受能力；publish 成功而 accept 中断时，现有显式 `accept` 可以恢复。make-decision、build-plan、verify-code 和 close 的人工边界保持不变。
- **FR-004 receipt 与 review 顺序**：build-spec、build-plan 必须先形成草稿并完成异源审查，按 finding 最多修订复审一次，再写一次正式 create-only receipt；正常新任务不得依赖 revision receipt。
- **FR-005 质量事实**：`revise_required`、测试失败、AC gap 和 provider `unavailable` 必须如实进入现有 facts/human brief，不得伪装 pass，也不得新增质量硬门。身份、Workspace、跨任务 provenance、安全、权限和不可逆授权错误继续硬阻断。
- **FR-006 checkpoint 与 Workspace**：build-code 开工前和 implementation receipt 前必须复查 accepted spec/plan/tasks 与认证 Workspace。合法 no-diff checkpoint 必须成功；存在额外 changed path 时必须失败。
- **FR-007 verify 返工**：复用现有 verify failure publication、controlled reopen、accepted pointer 和历史归档，闭合 `build accepted → verify fail → reopen → revised build accepted → fresh verify`。旧 accepted bytes 必须保留，同一 reopen 不得重放。
- **FR-008 AC 覆盖**：Code Builder 必须对 accepted AC 逐项给出 `covered/missing/unknown` 和证据引用，放入现有 test evidence/human brief；不得新增 evidence schema，也不得仅凭 accepted 声称质量通过。
- **FR-009 close 缺陷**：archive 前必须创建父目录；`ls-remote` 网络、认证或代理失败必须保留原 exit/stderr，只有成功读取远端 OID 且不同时才能报告 baseline changed。同 plan、零 Git 写入时复用原 confirmation 和现有 reconcile。
- **FR-010 handoff**：扩展现有 human brief 文本，提供阶段结果、关键决定、正式产物、测试/审查证据、下一阶段依赖、未解决风险、下一步和 canonical refs；不得复制完整 spec/plan/test output，不得新增 handoff schema。
- **FR-011 Coder 合同**：不新增 Coder/phase Skill，不给 Coder 绑定完整 `build-code`。Code Builder 必须提供 Phase 目标、AC IDs、Workspace、允许文件、非目标、测试命令和上游 finding。存在正确测试 seam 时先 RED 后最小 GREEN；Coder 运行聚焦测试和必要回归、检查 scoped diff、输出证据，但不 commit/review/accept/merge/push/close。

### Multica

- **FR-012 大白话留言**：所有 Agent comment 必须先说明当前状态、刚完成、下一步由谁做、用户是否需要操作。需要用户决定时必须给出问题、推荐项、推荐理由、2～3 个互斥选项及各自后果和风险，用户只需回复选项。
- **FR-013 升级边界**：范围内、可逆的问题由当前 Agent 自行处理；上游输入错误时在上游 Issue comment 并真实 mention 上游 Agent，写清 `return_to_issue` 和完成标准；上游修好后回原下游 Issue、附证据并真实 mention 原下游 Agent。只有业务范围/验收变化、权限、安全、不可逆操作和确实不可恢复的外部阻断才能升级用户。
- **FR-014 Issue 拓扑与状态**：根 Issue 始终由工头/Squad负责，build-code Issue 始终由 Code Builder负责，Phase 必须挂在 build-code Issue 下。五阶段严格串行；一个逻辑 Phase 只有一个 Issue，返工/review/reopen 复用原 Issue。接手为 `in_progress`，等上游为 `blocked`，等用户为 `in_review`，完成为 `done`，废弃为 `cancelled`。
- **FR-015 触发与等待**：stage 1～4 accepted 后当前 Issue 进入 done，由原生 barrier 唤醒父 Issue assignee，不再重复 mention。上游返回使用真实 Agent mention。同步命令有界等待，禁止无界轮询。陈旧 completion/mention 必须先校验 active generation、stage 和 accepted ref，过期时快速 no-op。
- **FR-016 单活动 generation**：同一父 task 只能有一条活动 generation。身份可信的 runner migration/retry/reopen 复用原 generation；身份/provenance 不可信时自动建立 replacement generation并走既有方向/计划边界。新链激活后旧链立即全部 cancelled。
- **FR-017 verify 与最终收尾**：verify accepted 后保持 `in_progress` 并显示“验证通过，交付收尾中”；close `completed/ready` 后 Code Verifier 将 verify Issue设为 done，由 stage-5 barrier 唤醒工头。工头把有效链全部设 done、废弃链设 cancelled、清除过期 metadata，确认没有非终态子 Issue，最后才把父 Issue设 done。
- **FR-018 配置发布**：只原位更新现有工头、五个 Stage Agent、Coder、Squad 和五个 WorkflowHub Skill；不新增 Agent/Squad/Skill。覆盖前等 Agent idle并保存快照，覆盖后逐项回读 Skill ID、supporting files、绑定和 Prompt。
- **FR-019 Canary 验证**：外部小项目 Canary 必须验证五阶段、两个 Phase、一次确定性 verify 返工、真实上下游 return handshake、完整 close 和最终清理。真实 Agent mention没有产生新 run时 Canary 失败、恢复线上快照并暂停推广，由 Multica 平台独立处理。ZHI-102、ZHI-184 由用户自行结束，不属于本任务执行范围。

## 4. 验收标准

- **AC-001**：独立任务 worktree 基于选定 main；事故 detached commits 有逐项取舍记录，未发生整串 merge。
- **AC-002**：runner 与 candidate 分离；runner OID 匹配时五阶段入口可运行，漂移时在任何 task/Workspace 写入前失败。
- **AC-003**：build-spec/build-code 一次 `run` 后 accepted；模拟 publish 后中断时显式 `accept` 可恢复；其余人工边界未变化。
- **AC-004**：build-spec/build-plan 在 review 修订后不再出现 `EEXIST`；同一业务问题最多初审一次、修订复审一次、正式 receipt 一次。
- **AC-005**：`revise_required/test fail/AC gap/unavailable` 均以真实状态进入下一既有人工边界；没有新 gate，没有任何假 pass。
- **AC-006**：合法 no-diff checkpoint 通过；注入额外 changed path 时失败。
- **AC-007**：完整 E2E 证明 verify fail 可触发原 task reopen、新 build accepted 和 fresh verify；旧 accepted bytes 保留、新 active pointer 生效、archive 不冲突、reopen 不可重放。
- **AC-008**：每项 AC 都有 `covered/missing/unknown` 和证据；review baseline 来自认证 Workspace。
- **AC-009**：archive 父目录不存在时 close 成功；网络/认证/代理错误与真实 remote OID 变化返回不同错误；同 plan 中断可恢复且不重复确认。
- **AC-010**：下一阶段只读 handoff 摘要和 refs 即可找到正式产物、证据、依赖和风险，不再询问已确认的数据根、路径或 AC。
- **AC-011**：Coder 使用完整 Phase 输入完成适用的 RED/GREEN、聚焦测试、必要回归和 scoped diff；没有 commit/merge/push，也没有绑定完整 build-code Skill。
- **AC-012**：检查本次 Canary 产生的全部 Agent comment；每条均符合普通状态模板或决策卡，“无需用户处理”明确可见，内部术语放末尾。
- **AC-013**：上游修复 comment 的 Agent mention 发布后，在没有用户评论或新 Issue 的情况下产生分配给原下游 Agent 的新 run，原下游 Issue 回到 `in_progress`；未产生时 Canary 失败，不增加轮询兜底。
- **AC-014**：父子/stage/assignee/status 全部符合 FR-014；stage barrier 每阶段只产生一次推进，没有双触发。
- **AC-015**：注入一次陈旧或重复 completion 后快速 no-op；只有一条活动 generation，旧链全部 cancelled。
- **AC-016**：close 后有效阶段/Phase 全 done、废弃历史 cancelled、父 Issue最后 done，且不存在 todo/backlog/in_progress/in_review/blocked 子 Issue。
- **AC-017**：WorkflowHub 在无 Multica 环境完成现有核心测试；源码和 Skill 闭包中不存在 Multica API/Issue/status/mention/generation 依赖。
- **AC-018**：Multica 覆盖部署前后快照可比；五个 Skill ID与绑定保持不变，supporting files和 Prompt回读一致。
- **AC-019**：外部 Canary 完成完整五阶段、一次返工、close和清理；记录总时间、run数、用户评论数、重复 review/test 次数和人工救火次数，但未建设监控服务。
- **AC-020**：本任务不恢复或修改 ZHI-102、ZHI-184；最终交付证据明确记录这项用户范围修订。

## 5. 非功能要求

- **NFR-001 独立性**：WorkflowHub 可脱离 Multica 独立运行；Multica 配置不成为 WorkflowHub runtime 依赖。
- **NFR-002 简洁性**：优先复用现有 accepted/checkpoint/reopen/reconcile/stage barrier/status/mention；不新增 Skill、依赖、后台服务、通用状态机或新 schema。
- **NFR-003 可维护性**：改动限于现有 runtime/core/Skill/test 与现有 Multica 配置；每项修改可追溯到本规格的 FR/AC。
- **NFR-004 可证伪**：失败、缺数据和 unavailable 必须显示真实状态；不能以兜底制造绿色。
- **NFR-005 安全性**：身份、Workspace、跨任务 provenance、权限和不可逆 close 授权继续 fail-loud；不得 force push、自动 rebase 或自动回滚。

## 6. 来源覆盖索引

- 用户要求“留言说清状态、下一步、是否升级人工”：FR-012，AC-012。
- 用户要求“Agent 自修、返回上游、只在真实阻断找人”：FR-013、FR-015，AC-013。
- 用户要求“阶段产物、证据、依赖交接”：FR-010、FR-014，AC-010、AC-014。
- 用户要求“Coder 知道开发/TDD/测试/审查/留痕”：FR-008、FR-011，AC-008、AC-011。
- 用户要求“功能收尾后工头清理全部子 Issue”：FR-017，AC-016。
- ZHI-102 runner 自托管、accepted 后返工、AC 遗漏、旧 generation：FR-001～FR-008、FR-016，AC-001～AC-008、AC-015。
- ZHI-184 no-diff、close 目录、网络误报和 close 长尾：FR-006、FR-009、FR-017，AC-006、AC-009、AC-016。
- 两个任务共同的轮询、重复触发、交接过期、人工救火：FR-004、FR-005、FR-010、FR-012～FR-015，AC-004、AC-005、AC-010、AC-012～AC-015。

## 7. 明确排除

- WorkflowHub Multica adapter/API。
- 通用 recovery/generation/state 平台。
- watchdog、轮询/revisit、daemon 重试、通知服务。
- runner release manifest/lock、provider registry、认证/签名/token。
- 新 Coder/phase Skill、新 evidence/handoff schema。
- mutable receipt、覆盖/删除 accepted、force push、自动 rebase/rollback。
- PR 追踪、常驻 token/时长监控、完整 close readiness 平台。

## 8. 已比较的替代方案

- 不采用 WorkflowHub 内建 Multica adapter、通知或 generation 平台：它会把两个独立系统绑死，并重建已被 simplicity-guard 排除的长期基础设施。
- 不只改 Prompt：runner、receipt、verify reopen 和 close 都有已复现的 WorkflowHub 代码缺陷；只改 Prompt 无法闭合物理事实。
