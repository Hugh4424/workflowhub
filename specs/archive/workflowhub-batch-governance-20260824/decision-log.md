# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 只使用 trusted clone 建独立 worktree/分支；原始 checkout 只读 | 用户原文：“严格使用独立 trusted clone，不得触碰原始 checkout” | D-001；已绑定 |
| R-002 | 从 make-decision 开始，不跳阶段、不用 build-spec 偷补需求 | 用户原文：“必须按标准 WorkflowHub 生命周期从 make-decision 开始” | D-002；make-decision 已完成，当前 build-plan |
| R-003 | 对 UI contract 与 trust recovery 累计改动做一次整批审计、合并、删除、简化 | 用户原文：“现在只做一批系统治理，不再接受后续小补丁” | D-003；待 inventory |
| R-004 | 不新增 skill、public stage、public gate、第二状态机、第二 writer、第二 evidence store 或重复对象 | 用户原文第 2 条 | D-004；待 inventory |
| R-005 | 检查 skill 消费、catalog/dependency、bundle closure、runner/handle/bridge、quality/review/snapshot/freshness、旧记录、测试和维护成本 | 用户原文第 3 条 | D-005；待 inventory |
| R-006 | 每个保留 gate/对象/写入口必须有唯一 owner、真实 consumer、完成 oracle、失败语义和兼容/删除条件 | 用户原文第 4 条 | D-006；待简化设计 |
| R-007 | 保留原始需求、事实、选择、理由、风险、延期和未完成/不可用；绿色事实不等于验收/release | 用户原文第 5 条 | D-007；已绑定 |
| R-008 | 只在独立 worktree 修改；不自动提交、推送、合并；如有基线测试失败必须分层保留 | 用户原文第 6、7 条 | D-008；待测试 |

## 目标

- 目标：在健康基线 `74a246ea542d82b1fd0d00bc721b0890911c3d52` 上，先形成完整 inventory 和一次性简化设计，再按确认方向治理现有内部表面。
- 用户结果：得到前后对象/gate/stage/writer/测试职责对比，明确保留、合并、删除项，不把质量事实误报成验收或 release。

## 成功/失败边界

- 成功边界：inventory 覆盖用户点名的运行时、技能、事实、review provenance、兼容和测试；简化设计逐项给 owner、consumer、oracle、失败语义和删除条件；之后才进入代码治理。
- 失败边界：原始 checkout 被写入；当前 task 未绑定；缺关键 owner/consumer/oracle；把 unavailable、unknown、绿色测试或空 findings 改写为通过；未经授权 commit/push/merge。

## 范围

- 当前范围：trusted clone 的独立 worktree；UI contract 与 trust recovery 累计的运行时、技能、质量事实、review、snapshot/freshness、bundle/catalog、stage runner、bridge、task handle 和测试表面。
- 用户流程/结果只记索引和验收影响，细节进入后续 spec/plan；当前先完成 make-decision、只读盘点和简化方向确认。

## 非目标

- 不修改原始 checkout。
- 不新增产品方向、public stage/gate/skill、第二状态机、第二 writer、第二 evidence store。
- 不混入 PaperBuilder 前端实现、产品验收、release、commit、push、merge 或 cleanup。
- 不为了归零测试而掩盖失败。

## 决定

### D-001

- question/final_option: 工作边界；选项：trusted clone 的独立 worktree/分支。
- recommendation/plain_language: 推荐；把事实和改动集中在可回滚副本。
- decision: 当前任务只使用 `/Users/Hugh/Hugh/Project/workflowhub-batch-governance-20260824`，原始 checkout 只读。
- source_type/reference/exact_excerpt: user_requirement/R-001/“严格使用独立 trusted clone，不得触碰原始 checkout”。
- approval_binding: confirmed_by_user_requirement；最终治理方向待确认。
- facts_and_constraints: trusted clone HEAD 为 `74a246ea542d82b1fd0d00bc721b0890911c3d52`；原始 checkout 有未提交修改。
- Logic: 原始 checkout 有用户改动 -> 不能作为写入事实源 -> 使用独立 worktree -> 可安全盘点和回滚。
- choice_reason/impact: 不影响用户现有工作；inventory、材料和后续代码只落独立 worktree。
- consequences_and_risks: 需持续核对基线和 worktree；不能从原始 checkout 脏改动推断本批设计。
- rejected_alternatives: 原始 checkout 直接修复；违反边界。
- unresolved_items/owner: 无；当前 owner 为本 task。
- Supersedes: none

### D-002

- question/final_option: 生命周期；选项：从 make-decision 开始，先盘点和确认。
- recommendation/plain_language: 推荐；避免把需求缺口塞进 build-spec。
- decision: 先完成范围、Talk、必要研究、Grill、decision-log 和确认；inventory/简化设计确认前不改代码。
- source_type/reference/exact_excerpt: user_requirement/R-002/R-003/“先产出完整 inventory 和简化设计，再改代码”。
- approval_binding: confirmed_by_user_reply；用户已确认进入 `build-spec`，随后继续 `build-plan`。
- facts_and_constraints: make-decision 已形成完整 inventory、简化设计、Talk/Grill 和用户确认；代码实现仍须等 build-plan 后进入 build-code。
- Logic: 方向未确认 -> 不能直接编码 -> 先形成可审查治理边界 -> 用户确认后进入 build-spec/build-plan -> build-code 才执行实现。
- choice_reason/impact: 保留需求、事实、风险、延期可追溯性；延后实现变更。
- consequences_and_risks: Talk/Grill/独立建议不可用时保留 unavailable/incomplete，不能用默认选择补齐。
- rejected_alternatives: 在 make-decision 未确认前直接编码；违反明确生命周期边界。
- unresolved_items/owner: 逐项 consumer、oracle、删除条件由当前 build-plan 任务卡收敛；本 task owner。
- Supersedes: none

### D-003

- question/final_option: 旧记录兼容怎么留；选项 1：只有真实消费者需要的旧记录保留最小只读兼容层，无消费者的旧记录删除。
- recommendation/plain_language: 推荐；保住真实历史读取，同时停止维护没有消费者的旧表面。
- decision: 旧记录只保留被当前真实 consumer 读取的最小只读路径；不得升级为当前事实、writer、gate 或 release 依据；无 consumer 的旧记录、旧 catalog 声明、旧 bundle/fixture 删除或归档。
- source_type/reference/exact_excerpt: user_reply/T-001/“只有真实消费者需要的旧记录保留最小只读兼容层，无消费者的旧记录删除”。
- approval_binding: confirmed_by_user_reply；Round 1 已确认，最终 make-decision 仍待 Talk/Grill/最终确认。
- facts_and_constraints: 旧 writer 已被 vNext 拒绝；历史 read-only 测试仍可能是边界；catalog、docs、bundle 和 fixture 可能有幽灵引用。
- Logic: 真实 consumer -> 保留最小只读适配 -> 不进入 current fact/close/release；无 consumer -> 删除重复表面 -> 降低维护成本。
- choice_reason/impact: 同时满足历史可读性与简化目标；影响 legacy reader、catalog、bundle、旧测试和文档，不改变五阶段或四材料。
- consequences_and_risks: consumer 判断必须有代码/测试证据；误删隐藏 reader 会破坏历史读取；兼容层需明确删除条件。
- rejected_alternatives: 全部保留；维护成本不下降。全部删除；可能破坏真实历史读取。
- unresolved_items/owner: 逐项 consumer、owner、oracle、删除条件由 research/inventory 固化；本 task owner。
- Supersedes: none

### D-004

- question/final_option: verify-code 双 `code_review` 如何收敛；选项 1：保留一个 canonical `code_review` owner，其他 review 保留原始建议/provenance，不再争同名完成事实。
- recommendation/plain_language: 推荐；减少重复 owner，同时不丢掉异源 review 原文和 provenance。
- decision: `dsh-code-review` 作为 verify-code 完成判断的 canonical `code_review` owner；wh-review 保留原始建议与 provenance，但不再生成并列同名完成事实。不得新增 writer、evidence store 或 public gate。
- source_type/reference/exact_excerpt: user_reply/Round-2/“若只是对已确认的‘整批治理、优先复用、不新增 public gate/stage/第二 writer/第二状态机’做细化，采用推荐项并如实记录，不要改 WorkflowHub 代码”。
- approval_binding: confirmed_by_user_reply；这是既有治理方向的细化，不改变产品方向。
- facts_and_constraints: 当前存在 dsh 与 wh-review 两条同名生产链；完成/close 需要唯一 current consumer；原始 review result、attempt、finding 必须保留。
- Logic: 双同名链 -> provenance/consumer 分叉 -> 一个 canonical completion owner + advice-only provenance -> 简化而不丢事实。
- choice_reason/impact: 最小 owner 数；影响 verify-code stage outcome、quality fact、close 和 review consumer。
- consequences_and_risks: 需要绑定 result/ref/hash；若外部消费者要求两个同名结果，先保留 needs_human，不擅自删除。
- rejected_alternatives: 两个不同 subject；语义清楚但表面更多。维持双同名；保留重复 owner。
- unresolved_items/owner: 精确 ref/hash seam 和外部 consumer 需 Grill/后续 plan 固化；本 task owner。
- Supersedes: none

### D-005

- question/final_option: `quality/verify.json` / legacy quality-store 如何处理；选项 1：暂保留为只读兼容投影，reader 迁移后删除。
- recommendation/plain_language: 推荐；不在本批冒险迁完所有现有 readers，但不允许兼容投影成为第二质量真相。
- decision: 暂保留真实 readers 仍需要的兼容投影；canonical quality fact 仍由 TaskKernel 唯一写入；迁移所有 readers 且负向测试证明后删除投影/legacy writer。
- source_type/reference/exact_excerpt: user_reply/Round-2/“若只是对已确认的‘整批治理、优先复用、不新增 public gate/stage/第二 writer/第二状态机’做细化，采用推荐项并如实记录，不要改 WorkflowHub 代码”。
- approval_binding: confirmed_by_user_reply；这是兼容边界细化，不改变产品方向。
- facts_and_constraints: `quality/verify.json` 仍被 bootstrap/status/public behavior/per-AC readers 消费；legacy quality-store 仍服务 mini-task/legacy；vNext TaskKernel quality fact writer 不得被替代。
- Logic: 仍有真实 reader -> 暂保留最小只读投影 -> 不进入 current quality truth -> 全部迁移后删除。
- choice_reason/impact: 控制本批改动面和回归风险；影响 task-store、quality-store、status、release reader、legacy tests。
- consequences_and_risks: 兼容投影短期仍存在；必须防止下游把它当并列质量真相。
- rejected_alternatives: 本批一次迁完并删除；范围和回归风险过大。并列质量真相；违反简化原则。
- unresolved_items/owner: reader 清单、迁移 oracle、最终删除条件由 build-plan 固化；本 task owner。
- Supersedes: none

### D-006

- question/final_option: verify-code 两条同名 `code_review` 链如何收敛；采用最小方案：保留 `dsh-code-review` 为 verify-code 执行审查，`wh-review` 改为已有 review/advisory subject 的异源 advisory，不再写同名 canonical `code_review`。
- recommendation/plain_language: 推荐；只保留一个完成真相，保留异源建议和 provenance，不增加 writer 或对象。
- decision: `completion`/`close` 只消费唯一 canonical `code_review` ref/hash；`wh-review` 的异源 advisory 另用已有 subject 表达，原始 attempt/finding/provenance 继续保留。
- source_type/reference/exact_excerpt: user_reply/current delegation/“保留 dsh-code-review 作为 verify-code 执行审查；wh-review 保留为异源 advisory，但不再写同名 canonical code_review，改为已有 review/advisory subject；completion/close 只消费唯一 canonical ref/hash。”
- approval_binding: confirmed_by_user_reply；这是 OPEN-003 的最小收敛，不改变整批治理方向。
- facts_and_constraints: 当前存在两条同名生产链，canonical quality fact 由 `TaskKernel` 写入；不得新增 stage、writer 或对象。
- choice_reason/impact: 消除 provenance 分叉和 close/completion 不一致；外部 consumer 若仍依赖同名 `wh-review code_review`，迁移前只能保持兼容读取或标记风险，不能偷偷改写历史事实。
- consequences_and_risks: 需要核对已有 advisory subject 和所有外部 reader；迁移期间旧记录只读兼容，canonical ref/hash 绑定必须有冲突、缺失和 unavailable 负向测试。
- rejected_alternatives: 保留两个同名完成事实；会继续产生第二真相和维护成本。新建第二 writer/第二对象；违反用户边界。
- unresolved_items/owner: 已有 advisory subject 的精确字段/reader 映射和删除条件由后续 build-plan 固化；本 task owner。
- Supersedes: D-004 对 `code_review` 的补充细化。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | Round 1：旧记录兼容路径是有限保留、永久保留还是一次性删除 | 影响删除收益与历史可读性 | 用户选择 1：“只有真实消费者需要的旧记录保留最小只读兼容层，无消费者的旧记录删除” | 1 个问题已回答；兼容边界固定，进入研究 | user_reply/T-001 |
| T-002 | Round 2：双 `code_review` 统一一个 canonical owner，还是保留两个不同 subject | 影响 provenance、completion 和维护面 | 采用推荐项 1；用户要求既有治理细化采用推荐项 | 2 个问题已回答；进入 direction advice | user_reply/Round-2 |
| T-003 | Round 2：`quality/verify.json` 立即删除，还是保留最小只读兼容投影 | 影响迁移范围和旧 reader 风险 | 采用推荐项 1；用户要求既有治理细化采用推荐项 | 2 个问题已回答；进入 direction advice | user_reply/Round-2 |
| T-004 | OPEN-003：两个同名 `code_review` 如何落到唯一完成事实 | 影响 verify-code provenance、completion、close 和外部 reader | 用户确认最小推荐：`dsh-code-review` 保留为执行审查；`wh-review` 改为已有 advisory subject；completion/close 只读唯一 canonical ref/hash | 方向已回答；精确 subject/ref/hash 和 reader 迁移留 build-plan | user_reply/current delegation |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | trusted clone 与原始 checkout 绑定 | trusted clone 干净且在健康基线；原始 checkout 有未提交修改 | completed | D-001 |
| F-002 | 当前 npm test 基线 | `Test Files: 14 failed / 151 passed / 165 total`；`Tests: 34 failed / 1829 passed / 24 skipped / 1887 total`；主要为 review policy、旧 writer/fixture、session binding、环境契约漂移 | completed_with_failures | D-008 |
| F-003 | catalog、bundle、stage dependency | 36 个 bundle；closure 与定向 smoke 通过；catalog 与 manifest/host consumer 有漂移和幽灵条目 | completed_with_findings | D-004/D-005 |
| F-004 | runtime、quality、review、freshness | TaskKernel 是正式 quality fact writer；serious finding fail-closed；verify-code 有两条同名 `code_review` 生产链 | completed_with_findings | D-005/D-006 |
| F-005 | bundle/catalog closure 与五阶段本地消费 | `npm run check:skill-closure` 通过；`npm run smoke:skill-packages` 通过（5 stages）；catalog 与 manifest/host consumer 对账仍有漂移 | completed_with_findings | D-004/D-005 |
| F-006 | current quality/review/freshness 定向测试 | 6 个文件、78 项通过；覆盖 freshness、five-stage facts、review layering、canonical review、wh-review CLI、close freshness matrix | completed_with_limits | D-005/D-008 |
| F-007 | build-spec 只读自检发现 trusted worktree 已存在 17 个已跟踪代码/测试文件修改，约 260 行增删；本轮没有通过 `apply_patch` 写这些代码，来源未认证 | 不能把这些 diff 当作本批已审计、已验收或已授权实现；不得 reset/clean 覆盖 | recorded_unattributed_change | 保留原状；build-plan 前先做 diff owner/consumer/oracle/测试对账；本阶段规格不依赖其通过 | D-001/D-008 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | catalog projection、quality projection、双 `code_review` 和 quality/completion 语义冲突 | 已逐项核实；不新增方向性问题。`code_review` 只保留一个完成 owner；旧 projection 只读兼容，迁移后删；`quality_status` 不等于 stage completion | CONTEXT no-change；ADR created；三项判据均真 | `CONTEXT.md`、`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`、inventory、simplification design |
| G-002 | F11 执行优先与现有 workspace/material/control seam 冲突 | 代码核对确认：deterministic path、`ArtifactDir` 双 `reference`、forbidden-option 检查和多个材料/能力 seam 是当前阻塞来源；新设计删除重复 owner，不新增新的 wrapper/gate；无新的领域术语需要写入 CONTEXT | CONTEXT no-change；F11 已新增；分支处置已确认 | `runtime/task/workspace.mjs`、`runtime/stage/stage-context.mjs`、`core/artifact-dir.mjs`、F11 redesign |

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | npm test 基线存在 34 失败 | 不能称为绿色或发布就绪 | needs_human | 分层保留；后续只修本批确认范围 | task owner / test report / retain |
| FND-002 | catalog 的 `used_by_stages` 与实际 manifest/host consumer 漂移 | 误导消费关系和删除判断 | needs_human | 以 manifest + stage-skill-plan 对账，修正或删除幽灵声明 | task owner / catalog closure tests / retain-or-delete |
| FND-003 | verify-code 有两条同名 `code_review` 生产链，缺少 ref/hash 绑定 | provenance 可能分叉，质量与 stage outcome 可不一致 | needs_human | 合并 consumer seam，或明确两个不同 subject；不新增 writer | task owner / stage runner + close / retain until fixed |
| FND-004 | `quality_status=passed` 可能与 stage `status=in_progress` 并存 | 下游可能误把质量摘要当完成/放行 | needs_human | 明确两者边界并补失败 oracle | task owner / completion consumer / retain until fixed |
| FND-005 | direction `wh-review` 已执行 doctor，但正式 run 返回 `status=unavailable`、`error_code=ENOENT`：标准 runner 要求确定性 `task/WorkflowHub/workflowhub-batch-governance-20260824` workspace；当前只有用户指定的 trusted worktree `codex/workflowhub-batch-governance-20260824` | 没有独立 provider advice；不能当作空 findings、通过或产品验收 | recorded_unavailable | 不创建第二 task worktree；以 inventory、事实和用户确认继续；若后续需要真实异源 advice，另开明确授权的审查/修复任务 | task owner / `wh-review` direction / retain unavailable |
| FND-006 | detail `wh-review` 也返回 `status=unavailable`、`error_code=ENOENT`；原因仍是标准 runner 的确定性 task workspace 缺失 | 没有独立 detail findings；不能当作无问题或通过 | recorded_unavailable | 保留 unavailable；继续以 Grill、决策草案和用户最终确认收敛；真实 detail advice 另开明确授权任务 | task owner / `wh-review` detail / retain unavailable |

## Talk Round 3

- 状态：completed_with_deferred_details
- 新的方向性问题：无。Round 1 的旧记录边界、Round 2 的 canonical `code_review` owner 和只读兼容投影均已由用户确认；剩余内容是实现级 consumer/oracle/ref/hash、测试分层和删除条件，不改变产品方向。
- 审查事实：`wh-review` direction run 为 `unavailable/ENOENT`；已保留原始不可用事实，不将其转换为 pass、空 findings 或 release 信号。
- 采用处理：不为了审查通道新建第二 task worktree；继续 Grill、最终确认和交接材料；异源 advice 若仍需要，列为明确延期交接。

## 最终确认

- 状态：confirmed
- 用户原文与 host-visible 绑定：用户确认“确认按当前决策草案进入 `build-spec`”。这只授权进入规格阶段，不授权改代码、commit、push、merge、archive 或 cleanup。
- 用户确认覆盖：完整保留/合并/删除边界；唯一 `code_review` completion owner；最小只读旧记录兼容；不新增 public gate/stage/第二 writer/第二状态机；保留 unavailable、失败和未完成事实。
- 进入条件：允许 `build-spec` 把本文件作为上游方向；不得由 `build-spec` 重新打开已确认方向或借规格补写产品决定。
- 仍未完成的质量事实：make-decision 的正式 content-addressed interaction aggregate 和 stage-end publication 受确定性 task workspace 缺失影响，若当前 writer 无法认证则保持 incomplete/unavailable；不得伪造 stage completed。

## 已确认决策（build-spec 输入）

### 目标

一次性治理过去两轮内部改动堆出的重复 owner、重复证据链、catalog 漂移、旧记录负担和测试维护面；优先复用现有五阶段、现有 closure checker、现有 `TaskKernel`、现有 freshness 和现有 completion oracle。目标是降低维护和阻塞成本，不改变 PaperBuilder 或其他产品方向。

### 保留

- `TaskKernel.publishVNextQualityFact`：唯一 canonical quality fact writer。
- `deriveStageCompletion` / `deriveCurrentProductRelease`：唯一完成/发布判定；stage handler 只做 disclosure adapter。
- `material_revision` 与 `material_scope_revision`：分别表达全局当前材料和阶段材料范围，不合并成第三种 revision。
- `snapshot_tree`、freshness、serious finding、原始 review attempt/finding/provenance：继续作为当前性、失败和追溯事实。
- bridge → adapter → runner 的边界校验：合并可共享的纯 validator，但保留 runner 最终认证和 replay 冲突 fail-closed。
- `quality/verify.json` 与 legacy quality-store：仅在真实 reader 仍存在期间作为最小只读兼容投影；不得写 current quality fact、close 或 release。
- v1/v2 collector、旧 flat attempt、`TaskHandle` legacy attempt API：按真实 reader 逐项迁移；有真实 reader 才保留只读兼容。

### 合并或改正

- `quality_fact_intent` 与 `review_fact_intent`：统一为现有 transport 名 `review_fact_intent`，不新增 adapter 对象。
- verify-code 的两个同名 `code_review` 生产面：只保留一个 completion owner；`dsh-code-review` 负责 stage completion 语义，`wh-review` 保留独立 advice/provenance，不与其并列第二个完成事实；最终必须由同一 canonical ref/hash 绑定。
- catalog、manifest、`stage-skill-plan.json`、bundle closure：以真实 manifest/host consumer 为源，catalog 只是 projection；修正 `used_by_stages`、effective closure、UI skill 和幽灵条目。
- `skills/reuse-registry.md` 与 `docs/reuse-registry.md`：保留前者为当前 machine truth，后者仅历史说明。
- `core/artifact-dir.mjs` 重复 `reference()`：删除死实现，保留当前实际实现。
- `quality_status` 与 completion/release：保留字段但明确是三层不同语义；下游只能消费既有 completion/release oracle。

### 删除（需满足条件）

- 无真实 consumer 的 `requirement-lineage`、`qa-only`、`verify-change`、`resolving-merge-conflicts`、standalone `isolated-browser-qa` catalog/bundle/注册、死 fixture、重复文档。
- 所有已迁移且通过旧记录只读和负向测试的 legacy writer/projection、v1 collector、old flat adapter、legacy attempt API。
- 删除前必须有唯一 owner、真实 consumer 清单、完成 oracle、失败语义、回滚点；历史决策和原始失败事实只读保留。

### 明确不新增

- 不新增 public gate、public stage、第二状态机、第二 evidence writer、第二 quality truth、第二 review flow、第二 close 状态或新的 product release gate。
- 不把 catalog closure、green test、stage ready、空 findings、`quality_status=passed` 伪装成产品验收或 release。

### 进入后续阶段的前置条件

- 用户已确认本决策进入 `build-spec`；本节是规格阶段的上游输入。
- `OPEN-003` 的 canonical ref/hash 与外部 consumer 兼容、`OPEN-001` 的逐项删除 oracle、`OPEN-002` 的 34 个测试失败分层，进入后续实现计划；它们不是新增产品方向。
- 当前异源 direction advice 是 `unavailable/ENOENT`，不影响继续整理决策，但不能称为独立 review 通过；若要补真实异源 advice，另开明确授权任务。

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 累计改动可能存在重复 owner、重复证据写入和不可消费抽象 | 继续小补丁会增加维护成本与 gate 死结 | make-decision inventory / task owner |
| RISK-002 | 旧 writer/fixture 与当前 vNext 契约漂移 | 误把兼容失败当代码质量失败，或反向恢复废弃 writer | research/build-plan / task owner |
| DEFER-001 | 代码修改、测试修复和最终前后数量对比 | 需等 inventory、简化设计和用户确认 | 同 task 后续阶段 / task owner |

## 质量边界

- 质量事实：只说明测试、review、closure、snapshot、freshness 等事实是否真实产生。
- 推进资格：四份当前材料可读只表示可继续工作，不等于质量通过。
- 完成判据：需要真实 owner/consumer/oracle、测试、review provenance、兼容/失败语义和用户确认；unknown/unavailable/incomplete 保留。
- 不可逆授权边界：commit、push、merge、archive、cleanup 均未授权。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 每条兼容路径的真实 consumer、oracle 和删除条件 | 选择已确认；逐项事实仍需 inventory | task owner；research-inputs |
| OPEN-002 | 当前测试失败哪些是治理目标、哪些是基线外部噪音 | 需要按失败层分类 | task owner；research-inputs |
| OPEN-003 | canonical `code_review` 的具体 result/ref/hash 绑定和外部 consumer 兼容 | owner 方向已定，接口细节未定 | task owner；Grill/build-plan |
| OPEN-004 | 真实异源 direction advice | 标准 runner 缺少确定性 task workspace；创建第二 worktree 不在本批边界 | task owner；后续明确授权的 review/修复任务 |
| OPEN-005 | local-object-integrity recovery worktree 的未跟踪材料/evidence 最终保留还是归档后清理 | 没有独立归档副本；删除 worktree 会丢失当前交接材料 | 用户单独授权后处理；当前只读保留 |

研究材料：`docs/research/workflowhub-batch-governance-inventory-20260825.md`、`docs/research/workflowhub-batch-governance-simplification-design-20260825.md`。它们是研究证据，不是第五份当前材料。

## 本批执行结果（2026-08-25）

本节只记录当前任务真实发生的材料和验证；没有代码治理实现。

### 边界与工作树

- 实际修改只发生在 `/Users/Hugh/Hugh/Project/workflowhub-batch-governance-20260824` 的独立分支 `codex/workflowhub-batch-governance-20260824`。
- 原始 checkout `/Users/Hugh/Hugh/Project/workflowhub` 未写入、未 reset、未 clean、未修复对象、未 commit、未 push、未 merge。
- 本批不改变 PaperBuilder 的交付状态；PaperBuilder 的实现、浏览器验收和未决风险单独记录。

### 本阶段材料

- 已写入完整 inventory、简化设计、decision-log 和 ADR-0019；这些都是治理材料，不是代码实现。
- 已记录最终用户确认，允许进入 build-spec；未授权代码、commit、push、merge、archive 或 cleanup。
- 已记录 direction/detail `wh-review` 的真实 `unavailable/ENOENT`，未把它改写成 pass 或空 findings。
- 当前 worktree 另有 17 个已跟踪代码/测试文件修改；来源未认证，本阶段不宣称已实现或已验收，且不执行回退、清理或覆盖。

### 明确没有做的事

- 本阶段没有通过当前 agent 修改 WorkflowHub 代码、测试实现、catalog、bundle、writer、stage、gate 或状态机；但 worktree 中已有未归属代码 diff，已按 F-007 保留并隔离记录。
- 没有删除 `quality/verify.json`、legacy quality-store、ghost skill/bundle 或旧 registry；删除条件只写入 spec/decision-log，留给后续实现计划。

### 当前验证事实

- `npm run check:skill-closure`：通过。
- `npm run smoke:skill-packages`：通过，5 个 stage。
- 定向质量层：6 个测试文件、78 项通过；这是基线审计事实，不是本批代码修复结果。
- 全量 `npm test` 基线：14 个文件失败，34 个测试失败；本批没有把它归零或宣称绿色。
- `git diff --check` 通过；当前 worktree 同时包含治理材料和 17 个未归属代码/测试 diff。
- 由于确定性 task workspace 缺失，make-decision interaction aggregate 和正式 stage publication 仍是 `incomplete/unavailable`；代码 diff 的来源也未认证。

### 交接与延期

- build-spec 只把已确认方向写成可测试规格，不补写缺失实现决定。
- 代码治理必须另行执行，仍需 reader、owner、oracle、删除条件和 34 个失败测试的分层计划。
- 本批没有 commit/push/merge；材料仍可逐文件回退，未执行破坏性清理。

## Supersedes

本 task 不改写历史 UI contract 或 trust recovery 记录；新决定只通过本 current `decision-log.md` 记录。

## 文档结果

- CONTEXT.md：no change；本批没有新增领域术语或改写既有概念边界。
- ADR：created；`docs/adr/0019-canonical-quality-ownership-and-compatibility.md`，记录已确认的单一完成归属和最小旧记录兼容。
- ADR criteria：hard to reverse=true（会影响下游 consumer）；surprising without context=true（当前存在两条同名生产链）；genuine trade-off=true（兼容收益与简化收益取舍已由用户确认）。
- 术语/ADR 冲突及处理：无冲突；继续以当前 `CONTEXT.md`、ADR-0017/0018 和本 ADR 的分工为准。
- 不复制 spec 的边界：本文件只保留需求、选择、理由、风险、owner/consumer/oracle 索引；实现细节留给后续材料。

## Exit checks

- 上下文一致：pass（trusted clone、分支和基线已核实）。
- owner/接口一致：incomplete（owner 方向已确认；具体 canonical ref/hash seam、catalog projection 对账和 reader 删除 oracle 仍待 build-plan 固化）。
- 失败语义明确：incomplete（测试与运行时失败路径已分层；`wh-review` direction 的 `unavailable/ENOENT` 已保留，兼容删除 oracle 和 canonical ref/hash 仍待 build-plan 固化）。
- 范围与延期明确：pass（当前范围、非目标、延期已写明；完整清单未决）。

## 最新方向修正（2026-08-25）

### D-007 — 新增“正常执行优先、控制面受限”宪法条款

- **用户纠正**：本次目标必须作为宪法新增条目写入，不能通过改写 F5、F8 或 F10 代替。
- **用户目标**：WorkflowHub 在保持高质量交付和不假绿的前提下，优先保证合法普通任务顺畅执行，并系统降低检查、校验、证据、gate、阻塞和长期维护成本。
- **decision**：新增 F11“正常执行优先、控制面受限”；F1-F10、Q1-Q3、S1-S8 的原条文和编号保持不变；宪法由 21 条增至 22 条，`constitution-checklist.md` 同步增加 F11。
- **plain-language consequence**：以后不能因为内部目录假设、review provider 不可用、历史记录缺失、catalog 投影漂移或辅助 evidence 缺失，就阻止正常任务继续；只有实际写边界、破坏性操作和正式 publication 的真实性问题可以在既有入口 fail-loud。
- **complexity rule**：不得把 F11 实现成新的 public gate、stage、state、writer 或 evidence store。新增任何内部控制前，必须先证明真实失败、唯一 owner、真实 consumer、完成 oracle、失败语义、退出条件和维护收益；否则删除或不添加。
- **supersedes**：此前“直接进入 build-spec 并按旧简化设计实现”的交接被本方向覆盖；旧 inventory、事实和用户已经确认的“优先复用、不新增 public gate/stage/第二 writer/第二状态机”仍保留，但现有实现方案必须重做。
- **approval_binding**：confirmed_by_user_reply；用户明确提出并纠正宪法变更方式。
- **next stage**：继续 make-decision 的重设计与方案审查；未形成新的最小控制面设计前，不进入 build-spec，不改 WorkflowHub 代码。

## F11 方案异源审查与处置（2026-08-25）

- **review**：直接使用 3rd-review 做异源审查；provider `pi/coding`，状态 `completed`，附件 `file_only` 完整性验证通过。结果为 4 条 major、3 条 minor；没有把 provider 完成写成方案通过。
- **FND-007 workspace**：当前 `workspace.mjs` 仍把 deterministic path/branch 当作读取已有任务的强制条件。处置：接受；新设计改为“deterministic 只用于新建默认值，已有 trusted worktree 通过一次 manifest 认证后直接消费”。
- **FND-008 duplicate material seams**：现有 `ArtifactDir`、material helper、`MaterialWorkspace`、`MigrationArtifactInspector`、能力 token 等表面没有完成 owner 替代映射。处置：接受；新设计禁止新增这些过渡控制面，已有无 consumer seam 进入删除/合并清单。
- **FND-009 deletion deadlock**：若未知外部 consumer 永久等同于真实 consumer，ghost surface 永远删不掉。处置：接受用户既定边界；没有代码/manifest/runtime/用户交付证据就不认定为真实 consumer，删除前保留可恢复归档，真实证据出现时只恢复最小只读兼容。
- **FND-010 forbidden-option control plane**：通过不断扩展 forbidden option 列表维护调用契约会继续制造阻塞。处置：接受；改为一个正向输入契约，删除重复的负向 option guard。
- **FND-011 complexity counter**：新增计数脚本会把 F11 变成新 gate。处置：接受但不新增脚本；只在一次性交接材料中记录修改前后对比，不进入运行时。
- **FND-012 F11 语义过宽**：若“控制面”不定义，F11 自身会变成主观 meta-gate。处置：已在 F11 明确为会阻塞、持久化状态、写事实或改变 public 行为的表面；F11 不产生运行时检查。
- **FND-013 ArtifactDir duplicate reference**：同名 `reference` 存在两个语义。处置：列入 P1 删除/合并，不保留两个同名实现。

**当前结论**：新设计可以继续 make-decision 方案收敛，但不进入 build-spec。下一步只做设计级 owner/consumer/deletion 对账；任何实现若需要新增 public gate/stage/state/writer/evidence store，立即停止并退回 make-decision。

## 分支与 Worktree 盘点（2026-08-25）

### 当前事实

- trusted clone `recovery-base-20260824/main`：clean，HEAD=`74a246ea542d82b1fd0d00bc721b0890911c3d52`，唯一健康基线。
- `workflowhub-recovery-base-20260824-workflowhub-local-object-integrity-recovery-20260824`：分支 HEAD 同为 `74a246e`，无 tracked source diff，只有 4 份 task 材料和 10 个 `quality/evidence` 文件；材料明确 `quality=incomplete`、`product_release=not_released`、无源码修改。
- `workflowhub-batch-governance-20260824`：当前活动 worktree，分支 HEAD 同为 `74a246e`，有 25 个 tracked diff 和本批材料/evidence；不把它们当成已验收实现。
- 原始 checkout `workflowhub`：独立 Git 对象库，分支 `codex/workflowhub-frontend-ui-recovery`，HEAD=`b519f974...`，约 36 条 WIP；对象遍历仍报缺对象，继续只读隔离。

### 处置决定

- recovery base `main`：保留，作为唯一健康基线。
- batch-governance：保留，作为当前唯一活动治理 worktree；继续 make-decision，不 reset/clean/prune。
- local-object-integrity recovery：标记为“只读归档候选”，不是代码合并候选。由于材料/evidence 仍是未跟踪文件，未获归档授权前不删除 worktree/分支。
- 原始 checkout：永久只读隔离；不复制、合并、修复对象、reset、clean、prune 或推断其 WIP 语义。

### 不能做的简化

- 不能因为两个 task 分支都指向同一个 HEAD 就删除其中一个：local-object-integrity 的未跟踪交接材料尚未有独立归档副本。
- 不能把未提交 source diff 当成 commit 合并；不能把 evidence 文件当成产品代码或 release 证据。
- 不能用 `git worktree prune` 或分支删除替代材料归档和用户授权。

### D-008 — 分支材料暂存与清理延期

- **用户确认**：用户接受推荐项；`local-object-integrity` worktree 暂不清理，等本批治理完成后再另开不可逆清理授权。
- **当前状态**：local-object-integrity 的未跟踪材料/evidence 继续保留为只读交接事实；不 merge、不删除、不提交、不推送。
- **清理条件**：先建立可回指归档并验证可读，再由独立授权处理 worktree/分支；归档和清理不属于本批正常治理路径。
- **风险保留**：材料仍未提交，当前删除会造成不可恢复丢失；因此本批不做 cleanup。
- **approval_binding**：confirmed_by_user_reply；只确认分支保留/清理边界，不授权任何不可逆 Git 操作。

## Make-decision 当前退出状态（2026-08-25）

- **Talk**：新的方向性问题已收敛；用户确认 F11 新宪法条款、执行优先重设计和分支保留策略。
- **研究**：已完成 trusted clone/worktree 图谱、三个任务路径状态、原始 checkout 只读与对象损坏事实；研究材料见 `docs/research/workflowhub-branch-worktree-audit-20260825.md` 和 `docs/research/workflowhub-execution-first-redesign-20260825.md`。
- **异源建议**：新设计的 3rd-review 已完成并完成 7 条 findings 处置；未将 provider 完成写成方案通过。
- **Grill 结论**：正常路径必须直接消费已认证 trusted worktree；deterministic path 只可作为新建默认值；复杂度对比只做一次性交接事实；未知 consumer 不得永久冻结 live 兼容面；不新增 public gate/stage/state/writer/evidence store。
- **未完成**：旧 `plan.md/spec.md/tasks.md` 仍是上一版治理方向的材料，尚未重建为 F11 方向的 build-spec；因此当前不能进入 build-spec，也不能执行代码修改。
- **下一步**：整理新的 decision card，等待用户对“F11 执行优先重设计整体方向”做最终确认；确认后再进入 build-spec，且 build-spec 不得重新引入旧控制面。

## 可见性失败（2026-08-25）

- **用户反馈**：用户无法确认，因为看不见当前决策和与用户的完整沟通。
- **事实判断**：本 task 的 `decision-log.md`、research、spec/plan/tasks 和 evidence 主要是 trusted worktree 中的未跟踪材料；正式 interaction aggregate/stage publication 仍不可用；task manifest 也没有显式当前 workspace 绑定。以上只能证明“当前材料没有形成用户可见的正式沟通投影”，不能单独证明具体 UI/host consumer 的唯一根因。
- **处置**：最终确认保持 `pending`；不得把用户此前对分支保留的确认扩展成对 F11 整体方案的确认；不得进入 build-spec 或代码实现。
- **修复原则**：make-decision 必须先在用户可见沟通中呈现完整 decision card（目标、范围、非目标、成功标准、风险、审查事实、未决项、延期项），再等待用户确认；文件存在、绿色测试、stage ready 或 aggregate 缺失都不能替代可见沟通。

## 当前有效阶段与审查事实（2026-08-25，覆盖前文历史状态）

本节是当前有效状态。前文“final confirmation pending”“尚不能进入 build-spec”“wh-review unavailable”只保留为历史事实，不再代表当前阶段。

- 用户已明确确认：按当前决策草案进入 `build-spec`，并继续进入 `build-plan`；当前不需要重新选择产品方向。
- 当前阶段是 `build-plan`；本轮目标是修复前一轮规格/计划审查未完成的根因，然后重新执行标配 `wh-review` 计划审查。
- 根因一：`openCurrentTaskWorkspace` 把已经提供的 trusted worktree 无条件拼成第二个 deterministic 路径，导致标准 stage/review 在 provider 之前 `ENOENT`。当前候选修复已经让 explicit existing、legacy linked-worktree 和 bootstrap contract focused tests 通过；该事实不是 build-code 完成声明。
- 根因二：Codex session handoff 原来没有按请求 stage 过滤/排序，bridge 又把合法的 step→skill 嵌套生命周期当成时间倒退；当前候选修复已增加 stage 投影、时间排序和跨 kind nested 兼容，并保留同类/部分重叠 fail-loud。该事实不是产品验收或 release。
- 根因三：旧 `tasks.md` 混入候选执行记录、循环依赖、旧 FR/AC 编号和过期的 `unavailable/ENOENT` 结论，导致 plan review 不能区分“待执行计划”和“历史候选事实”。已将当前 `plan.md`/`tasks.md` 重写为全 pending、无执行假象、唯一依赖图和完整 FR/AC 追溯；历史结果仍留在本日志和 task records。
- 标准 `wh-review` 的第一次真实 build-plan run 已经成功到达 provider，结果为 `available`，不是 `unavailable/ENOENT`。该次结果发现计划材料问题，不能当作本轮最终通过；结果 refs：
  - attempt：`quality/reviews/attempts/7c835bb0-8d51-471c-92cf-4c26d5cb113a/attempt.json`
  - result：`quality/reviews/results/build-plan-default-0edd7e4d77c454733de289a2bc81ae384924ba51-7c835bb0-8d51-471c-92cf-4c26d5cb113a.json`
  - report：`quality/reviews/reports/7c835bb0-8d51-471c-92cf-4c26d5cb113a.md`
- 该次 findings 的处置：删除旧 completed/exit/actual_changes 伪执行字段；修正 T000→T001→T002 依赖；统一 25-file current/17-file historical 口径；补齐 AC-011/AC-012、FR 追溯、AC-010 manual oracle；把 legacy deletion 改为条件分支；不把局部 workspace GREEN 外推成整体实现完成。
- 当前仍禁止 commit、push、merge、archive、cleanup、原始 checkout 写入和对象修复。前文“最终计划审查必须重新运行”是当时错误的流程判断，现由用户确认的“plan 只审一次”约束覆盖；后续不再执行新的 plan review。只有已经产生的 provider 终态 findings 才能作为历史审查事实。

## 本轮审查根因修复与 plan 处置（2026-08-25，覆盖前一节的旧审查状态）

- 已修复审查入口根因：existing trusted worktree 不再被拼成第二 deterministic 路径；session bridge 先按请求 stage 投影并按时间排序；`wh-review-cli` 不再按 task/stage 无条件复用旧普通结果，语义材料变化会绑定新的 semantic attempt；四份当前材料已归一到唯一的 `specs/workflowhub-batch-governance-20260824/`，官方 `ArtifactDir` 可直接读取。
- 标配 `wh-review` 的有效 build-plan attempt：`quality/reviews/attempts/235ad39c-f8bb-4a9d-9770-2d7ed3d464d4/attempt.json`，result：`quality/reviews/results/build-plan-default-ba0370bff91d533fb24a0269a405730c2f06bd3e-235ad39c-f8bb-4a9d-9770-2d7ed3d464d4.json`，终态 `available`，不是旧的 19-finding result，也不是 `unavailable`。该 attempt 的 8 条 major、1 条 minor 已逐项处理：T021/T022 拆分；T050 AC evidence matrix 和失败分类；T001/T002 去除未追溯的新增验收含义；T020 consumer census；T010/T011 canonical/advisory producer、reader、ref/hash、字节和冲突规则；T002 manifest producer/immutable 边界；T000 参数化四个 root 输入；T040 绑定现有 stage-runtime completion handoff。无 finding 采用 `accepted_risk`。
- 修复后的再次调用产生 attempt `quality/reviews/attempts/e5b56fe0-13e7-4b8d-83c8-36a61b666c03/attempt.json`，终态为 `unavailable`、错误 `OUTPUT_INVALID`，且没有 provider attempt/result。它是 broker 没有返回可认证 findings 对象的传输/协议事实，不是空 findings、不是通过，也不是本计划的 semantic finding；不得继续重试追求空结果。
- 当前 plan 结论：有效 `wh-review` advice 已消费并逐项修正；`OUTPUT_INVALID` 事实仍保留，不能被交接摘要改写。它不增加 public gate/stage/state/writer/evidence store，也不阻塞同一任务继续执行；后续 build-code 必须按 canonical 材料和任务卡真实验证。

## 外部 `wh-review` `PROTOCOL_INCOMPATIBLE` 根因与修复（2026-08-25）

- **根因**：旧 WorkflowHub `materialId` 把 provider bundle 中的 `canonical-evidence.json` 算进语义身份；当前实际路由到的外部 `3rd-review` v3 public broker 将 `manifest.json` 和 `canonical-evidence.json` 排除。两端对同一 bundle 得到不同 `material_id`，WorkflowHub 在 v3 group 顶层校验阶段拒绝结果，因此旧 P0A/P1 都是 `provider_called=true`、`provider_attempts=[]`、`0 valid reviewer result(s)`，不是 provider 空 findings。
- **修复**：只复用现有 bundle writer，把 `canonical-evidence.json` 从语义 `materialId` 计算中排除；它仍保留在交付 manifest 和审计材料中。没有新增 stage、gate、state、writer、evidence store 或 fallback hash。
- **验证**：新增 contract regression；定向 3 文件共 124 tests passed。TaskHandle receipt 为 `quality/tests/wh-review-material-identity-fix.json`，`exit_code=0`，`receipt_hash=07b3faee5f3718e77426dcc3753ce807222e27638a5191d99a84b08002092e8e`。
- **修复后外部审查**：用新的 material identity 发起一次真实 build-code/P1 `wh-review`；provider 进程启动，但约 15 分钟没有返回公开终态，随后停止本任务自己的等待进程。没有把它写成 pass、空 findings 或产品验收；这与旧的 material identity 协议冲突分开记录。
- **外部依赖风险**：当前 `/Users/Hugh/Hugh/Project/3rd-review` 是用户脏 checkout，排除规则未形成稳定 commit。本 task 不修改它；若路由回到旧算法，冲突会复发。provider 无公开终态还暴露了外部 liveness/timeout 语义缺口，需要单独授权的外部治理任务处理。
- **证据**：`docs/research/workflowhub-wh-review-material-identity-incident-20260825.md`；旧失败事实继续保留于 `evidence/build-code/T010-T011/review.json`，不覆盖、不改写。

## 用户纠正：plan 的 `wh-review` 只审一次（2026-08-25）

- **用户纠正**：`wh-review` 对 plan 的标准审查只应调用一次；修复审查发现后不应再次调用 plan review。
- **我的流程错误**：我把“修复已发现问题后再次确认”误当成必需步骤，连续调用了多次标准 plan review。这违反了既有 `wh-review` 生命周期约束，也增加了 provider、attempt、结果文件和维护噪声；不能用“每次结果都处理了”抵消这个错误。
- **历史事实保留**：已经产生的 attempt/result/report 和 `OUTPUT_INVALID` 记录不删除、不改写、不伪装成一次调用。历史调用包括 `7c835bb0-8d51-471c-92cf-4c26d5cb113a`、`235ad39c-f8bb-4a9d-9770-2d7ed3d464d4`、`dbff392d-8734-4974-8406-7a0fb5d15d69`、`74479a9b-6b97-497a-a9e6-ae201e28dd44`、`9d95b98b-55d9-44b7-921d-99e076289f2e`、`4449fb05-d96f-4dc9-a5ff-e58aea1a0c7f`，以及传输失败的 `e5b56fe0-13e7-4b8d-83c8-36a61b666c03`。这些记录只说明当时各材料快照的审查/传输事实，不合并成“单次通过”。
- **最后一次可认证结果**：`4449fb05-d96f-4dc9-a5ff-e58aea1a0c7f`，result=`quality/reviews/results/build-plan-default-1e0a887c38f817acd5468d7d2b392ebb0fd589ce-4449fb05-d96f-4dc9-a5ff-e58aea1a0c7f.json`，report=`quality/reviews/reports/4449fb05-d96f-4dc9-a5ff-e58aea1a0c7f.md`。它提出 6 条材料问题：T050/T040 顺序、T040 字段映射和 host 绑定、T050 review consume-only、T001/T002 同一 RED/GREEN 命令、T000 mapping/重叠硬前置、T022 删除边界。
- **离线处置**：只在不调用 review 的前提下修正 canonical `plan.md`/`tasks.md`：依赖改为 `T022 → T050 → T040`；T050 明确只消费已有唯一 review terminal result，不 broker retry/continuation/format retry；T000 增加 mapping/目标文件重叠硬前置；T040 补齐既有 completion 字段映射；T001/T002 共用同一 RED/GREEN 命令并把 doctor/integration 设为 supplemental；T022 改为 disposition-only，实际删除/归档/unregister 另需独立授权 cleanup task。
- **当前审查边界**：上述材料修正没有再次经过 `wh-review`，因此不声称“修复后 review 通过”。只做本地静态一致性检查；后续不得再调用 plan `wh-review`。若未来需要新的 review，必须作为新的明确生命周期/新任务授权，而不是本任务的自动重跑。
