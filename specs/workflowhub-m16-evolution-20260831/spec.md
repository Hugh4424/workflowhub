# 功能规格：M16 自进化候选池、迭代入口与负例库

> 基于当前任务已接受的 `decision-log.md`。本文件只定义用户可观察行为、数据契约、边界和验收，不定义实现文件、代码符号、工程方案或精确测试命令。

- **功能名**：WorkflowHub M16 自进化候选池、迭代简报、负例与改动台账
- **来源**：`decision-log.md` 的 R-001～R-014、D-001～D-010、OPEN-12～OPEN-15，以及 2026-08-31 build-spec Clarify 第 1 批真实回复
- **状态**：build-spec 当前规格
- **content_profile**：`spec-content.v3`

## 速读卡

- **一句话需求**：用户需要从每个 stage 的复盘判断中看到值得优化的 step/skill，在准备改动时得到只含事实与证据的简报，并用负例、改动台账和消融协议约束后续人工决策。
- **核心改动点**：
  - 跨任务生成两档候选池：机器强信号进入“建议行动”，其余判断进入“仅供参考”。
  - 现有 monitor 增加只读趋势区，展示候选和前期质量税，未知、过期、样本不足不补零。
  - 用户按需生成迭代简报；简报汇集候选、负例、改动台账、外部更新、保留行为、未决决定和市场对照槽位。
  - 建立 `attempted-edits`、`negative-results` 与消融协议；本期不执行消融、不裁决 remove、不自动修改。
- **最大影响面**：跨任务判断数据的聚合口径、monitor 只读展示、人工发起优化前的信息准备和后续改动追溯。
- **验收信号**：确定性样本覆盖候选分层、诚实状态、质量税、简报、台账与分域校验；既有任务视图保持不变；独立审查完成。
- **业务收益状态**：“step/skill 必要性”和“人工介入减少”均为【未验证，待真实任务数据】；不作为本期完成证明。

### 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001、R-002、R-014 | D-003、D-010 | FR-POOL-001～008；AC-POOL-001～005 | current / 候选身份、分层、诚实状态 | OPEN-12 在本 spec 关闭 |
| R-003、R-007 | D-001、D-009 | FR-BRIEF-001～009；AC-BRIEF-001～003 | current / 按需迭代简报 | OPEN-14 在本 spec 关闭 |
| R-004 | D-004、D-008 | FR-NEG-001～003；AC-NEG-001～002 | current / 负例库与 D24 分域 | OPEN-15 在本 spec 关闭 |
| R-005 | D-004、D-009 | FR-EDIT-001～003；AC-EDIT-001～002 | current / 改动台账 | 缺字段必须拒绝 |
| R-006、R-009 | D-004、D-005 | FR-ABL-001～003；AC-ABL-001～002 | current / 协议和待裁决状态 | DE-001 延期执行与裁决 |
| R-008 | D-001、D-007 | FR-POOL-001、FR-GOV-001；AC-GOV-001 | current / 消费上游复盘产物 | 不重建上游采集 |
| R-010 | D-002 | FR-PAGE-001～005；AC-PAGE-001～003 | current / monitor 只读趋势区 | 任务视图不动 |
| R-011 | D-001、D-003、D-005 | FR-POOL-003～005、FR-BRIEF-001；AC-POOL-002 | current / 系统化优化输入 | 必要性仍未验证 |
| R-012 | D-006 | FR-TAX-001～007；AC-TAX-001～003 | current / 前期质量税 | OPEN-13 在本 spec 关闭 |
| R-013 | D-008 | 第 10 节；AC-GOV-002 | non-goal / 禁止遥测复建 | 永久边界 |

每条 FR 和 AC 均回指本表；本规格未改变已接受方向。

## 1. 问题与紧迫性

WorkflowHub 已能在每个 stage 结束时记录带证据的判断，但这些记录仍散落在任务中。用户无法快速知道哪些 step/skill 反复带来人工介入、哪些只有主观判断、哪些值得优先验证，也缺少一次改动前后的统一追溯入口。继续靠新增 step 或 skill 解决局部问题，会扩大维护面，却不能回答“它是否必要、是否真的改善流程”。

本期要把现有判断层变成可消费的人工决策输入，同时守住三条边界：判断不冒充事实，系统不替人决定改法，缺数据不冒充趋势。

## 2. 背景、目标与范围

### 背景

- 上游 stage-reflection 已产出判断、人工介入和 lessons；判断身份固定为 `judgment`。
- 现有 monitor 已有跨任务待优化聚合，可作为同一数据入口扩展。
- M15 遥测已退役；本任务没有 token、耗时或 per-provider 数据源。
- remove 最终裁决需要后续消融证据，本期只有协议与台账。

### 目标

- 用户能区分“机器强信号建议行动”和“仅供参考判断”。
- 用户打开现有 monitor 即可看到候选与质量税的真实状态。
- 用户准备优化某 stage、skill 或 surface 时，可按需得到完整、可追溯、零方案文本的简报。
- 每次获批改动和失败结果都有可校验记录，为未来消融与回退提供证据。

### 范围内

- 项目级 `evolution-candidates.jsonl` 候选池及确定性聚合规则。
- monitor 只读趋势区：候选与前期质量税。
- 按需 `iteration-brief.md`。
- `attempted-edits.jsonl`、`negative-results.jsonl` 的写入与校验合同。
- 消融协议合同、外部 skill 更新检查和市场对照空槽位。
- 现有治理清单中登记新增持久对象的 owner、consumer、替代关系和删除条件。

## 3. 用户场景与状态覆盖

### SCN-001：用户浏览跨任务候选趋势

- **角色**：WorkflowHub 维护者
- **Given**：项目中已有零个或多个合规 stage-reflection 产物
- **When**：用户打开现有 monitor 的趋势区
- **Then**：页面显示两档候选、来源数量、最近出现时间、证据状态和判断身份；无数据时显示空态，不显示“没有问题”。

### SCN-002：机器强信号形成建议行动候选

- **角色**：候选聚合机制
- **Given**：完整消费扫描证明某对象零消费，或同一对象在 30 天内至少两个不同任务中发生人工介入
- **When**：候选池刷新
- **Then**：该对象进入“建议行动”档，并保留触发它的机器信号与来源；它仍不是删除许可。

### SCN-003：只有判断、没有机器强信号

- **角色**：候选聚合机制
- **Given**：存在合规 judgment，但机器信号缺失、未知或未达阈值
- **When**：候选池刷新
- **Then**：该对象进入“仅供参考”档；页面和简报不得把它显示为建议行动或已验证事实。

### SCN-004：用户按需生成迭代简报

- **角色**：准备改动 stage、skill 或 surface 的维护者
- **Given**：用户明确一个且仅一个目标范围，并提供当前项目与材料身份
- **When**：用户请求生成迭代简报
- **Then**：得到七个固定区块；每项只含结构化事实、状态与证据引用，不给改法，不自动修改。

### SCN-005：简报部分来源缺失

- **角色**：维护者
- **Given**：目标有效，但候选、负例、台账、外部更新或当前材料中的某个可选来源为空或不可用
- **When**：用户生成简报
- **Then**：简报仍生成，并在对应区块显示 `empty`、`unavailable`、`stale` 或 `not_checked` 及原因；不得省略区块或补造内容。

### SCN-006：记录获批改动与失败结果

- **角色**：维护者或受用户委托的 agent
- **Given**：用户已在当前 decision-log 中批准一个改动决定
- **When**：真实改动已发生并完成验证或回退，得到一个终态 outcome
- **Then**：改动台账一次追加完整的决定、改动面、前后事实、验证方法和回退引用；若属于 harness/process/skill-edit 失败或回归，再写入负例库。改动开始本身不产生未完成行。

### SCN-007：质量税样本不足或归因未知

- **角色**：浏览趋势区的维护者
- **Given**：30 天内有效人工介入少于 5 次，或部分归因不能映射到唯一上游 stage
- **When**：页面计算质量税
- **Then**：少于 5 次显示 `insufficient_samples`；未知归因单列，不分摊、不重复计数、不作因果结论。

### SCN-008：输入损坏或身份冲突

- **角色**：候选、简报或台账消费者
- **Given**：必需输入不合 schema、引用越界、项目身份冲突或同一记录出现互斥身份
- **When**：执行读取或写入
- **Then**：该动作明确失败且不覆盖最近一次有效产物；错误指出具体记录和规则。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-002、SCN-004、SCN-006
- [x] **空态**：SCN-001、SCN-005
- [x] **错误态**：SCN-008
- [x] **加载态**：N/A — 页面打开前快照已嵌入静态数据；页面不执行异步读取
- [x] **取消态**：简报生成在发布前取消时不覆盖既有文件；只读页面无取消动作
- [x] **边界态**：SCN-003、SCN-005、SCN-007
- [x] **权限态**：写台账必须有已批准 decision_id；只读页面不新增权限模型
- [x] **竞态**：同一快照内聚合；源在读取期间变化时本次结果标 `stale` 或失败，不混合两个版本

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：stage-reflection 输出具有判断、介入、证据和状态字段，可作为本期唯一上游数据源。（status: verified）
  - **status**：`verified`
  - **证据或来源**：decision-log F-001、F-002、F-101；R-008
  - **关联**：FR-POOL-001、FR-TAX-001、AC-POOL-001、AC-TAX-001

- **PFACT-002**：现有 monitor 已有跨任务判断聚合和诚实状态语义，可在同一只读入口扩展。（status: verified）
  - **status**：`verified`
  - **证据或来源**：decision-log F-101；D-002
  - **关联**：FR-PAGE-001～005、AC-PAGE-001～003

- **PFACT-003**：上游真实任务质量验证尚未完成，当前判断不能证明 step/skill 必要性或人工介入已减少。（status: verified）
  - **status**：`verified`
  - **证据或来源**：decision-log F-003、D-005、D-010
  - **关联**：FR-POOL-006、FR-TAX-006、AC-GOV-002、RISK-001

- **PFACT-004**：M15 遥测已退役，本期无 token、耗时、per-provider 或历史回填数据源。（status: verified）
  - **status**：`verified`
  - **证据或来源**：decision-log R-013、F-005、D-008
  - **关联**：FR-GOV-002、AC-GOV-002

- **PFACT-005**：当前 legacy 项目没有可绑定的唯一 `Design.md` 或 `Experience.md`；没有当前 M16 fixture、目标 viewport、preview 或 screenshot 证据。（status: verified）
  - **status**：`verified`
  - **证据或来源**：build-spec 的 `buildUiProjectInitFact` 返回 `status=not_ready`；`deriveDesignSourceReadiness` 返回 `binding_state=not_bindable`、空 read_map；`validateProjectStandardSources` 返回 `status=unknown`、missing design/experience
  - **关联**：FR-PAGE-001～005、AC-PAGE-003

- **PFACT-006**：未来真实任务是否证明候选排序有用、质量税下降。（status: unknown）
  - **status**：`unknown`
  - **owner、影响**：后续真实任务与用户；不影响本期基础设施验收，关联 DE-002、RISK-001
  - **关联**：FR-POOL-006、FR-TAX-006、AC-GOV-002

## 5. 功能需求

### 5.1 候选池（POOL）

- **FR-POOL-001**：每次 monitor 数据刷新时，系统必须从当前项目可读的 stage-reflection 产物确定性刷新同一份项目级候选池；不得调用 AI、不得读取退役遥测、不得回填历史任务。
  - **范围边界**：只消费合规判断、介入、消费边和引用状态
  - **依据**：D-001、D-007、D-008；PFACT-001、PFACT-004
  - **场景**：SCN-001、SCN-008
  - **验收**：AC-POOL-001、AC-GOV-002

- **FR-POOL-002**：来源观察与跨任务聚合必须拆成两个版本化身份。`observation_id.v1` canonical payload=`{project_id,target_ref,task_id,confirmation_ref,occurred_at,intervention_kind,intervention_payload}`，保留 task/time；`candidate_group_id.v1`=`{project_id,target_ref,normalized_intervention_kind,normalized_intervention_payload}`，明确排除 task_id、confirmation_ref、occurred_at，classification 也不参与。frequency 只计同 group 内 distinct task_id；同 task 多次观察只贡献 1，至少两个 distinct task_id 才形成 repeat-intervention strong signal。`target-resolver.v1` 支持 `stage|step|skill|surface` 六字段 target-ref：step 的 target_id=step_slug、target_version=stage manifest version、authority=versioned stage manifest ref/hash，且 step_slug→stage 恰好一条；缺失/歧义 fail-loud，只有不参与强信号的判断可降 reference_only。`intervention-signature.v1` 只规范 kind/payload，不含任务/时间。canonical JSON 仍为 UTF-8、递归 key 排序、无空白/末尾 LF、禁止 float；related_targets 按 bytes 排序去重。extreme fixture 保存 stage/step/skill/surface target、observation_id、candidate_group_id、signature 的 input/canonical_hex/sha256 fixed vectors，T001/T002 逐字节断言。
  - **范围边界**：不得从路径、标题、自由文本或 classification 反推/拆分 target identity
  - **依据**：D-003；PFACT-001
  - **场景**：SCN-001、SCN-003
  - **验收**：AC-POOL-001

- **FR-POOL-003**：候选记录必须包含版本、稳定 candidate_group_id/candidate_id、观察时间、first/recent、frequency、severity、priority_score、classification、判断身份、tier、canonical target、related_targets、按 observation_id 排序的 source observations、引用、机器信号、状态、open decision 与 supersedes。classification precedence 不变；同一 observation_id 同值折叠、异值整次失败。frequency=`distinct(source_observations[].task_id)`；first/recent 取 observation occurred_at min/max；severity/priority/confidence 先按 observation_id 去重后按既定 max/sum/worst 计算。不同 task 的相同 kind/payload 必须落同 candidate_group_id；相同 task 的不同 confirmation/time 不增加 frequency；不同 normalized payload 必须分组。机器 proof 冲突仍 unknown。
  - **范围边界**：禁止自由文本方案、改法、自动操作和无来源结论
  - **依据**：R-002、R-014、D-003、D-010；PFACT-003
  - **场景**：SCN-001～SCN-003
  - **验收**：AC-POOL-001、AC-POOL-004

- **FR-POOL-004**：`tier=action_suggested` 仅在以下任一强信号成立时允许：当前 `consumer-scan-proof.v1` 明确证明该对象零消费；或同一对象在 30 天内至少两个不同任务中出现有效人工介入。零消费 proof 必须绑定 project、task、candidate snapshot、source subject、30 天窗口、scanned_at、scope_revision、登记 output refs、expected/scanned stage set、coverage_status、diagnostics 和 source refs；仅当 coverage=`complete`、五阶段 inventory 已绑定、登记 outcome/输出引用全部可读、扫描前后 scope_revision 不变、登记输出至少一条且消费者数全为 0，才允许 zero_consumption=true。partial、unknown、unavailable、stale、空输出集或 identity/hash/schema 冲突一律令零消费为 unknown。proof 必须绑定当前候选 snapshot，旧 proof 不得证明新快照。一次介入、unknown 消费状态或仅有判断不得进入该档。
  - **范围边界**：此档只表示值得行动验证，不表示 remove、merge 或修改已获批准
  - **依据**：D-003；2026-08-31 Clarify 1A
  - **场景**：SCN-002、SCN-003
  - **验收**：AC-POOL-002

- **FR-POOL-005**：没有强信号但存在合规判断时，候选必须进入 `tier=reference_only`；机器信号缺失时保留 `unknown`，不得按 false 或 zero 处理。
  - **范围边界**：仅供参考档不得排序到建议行动档之前
  - **依据**：D-003、D-010；PFACT-003
  - **场景**：SCN-003
  - **验收**：AC-POOL-002、AC-POOL-004

- **FR-POOL-006**：候选状态必须使用一个 canonical 多维对象，不得另加通用 `status`：`lifecycle_status=open|deferred|verified|rejected|superseded`、`row_status=active|historical`、`freshness=current|stale`、`evidence_status=complete|partial|unknown|unavailable`、`sample_status=sufficient|insufficient_samples`、`validation_status=verified|unverified|not_applicable`。页面与简报逐维原样消费：unavailable 只来自 evidence_status，stale 只来自 freshness，样本不足统一写 `insufficient_samples`，“待验证候选”只来自 validation_status=unverified；不得把一个维度提升或覆盖另一个维度。
  - **范围边界**：状态不阻断工作，也不构成继续工作的许可证
  - **依据**：D-005、D-010；PFACT-003、PFACT-006
  - **场景**：SCN-001、SCN-003、SCN-007
  - **验收**：AC-POOL-003、AC-GOV-002

- **FR-POOL-007**：候选池 JSONL 只追加不可变完整 snapshot 批次，既有 crash/batch 规则保持。transition authority 必须精确绑定 `{current_snapshot_id,candidate_record_id,candidate_id,expected_revision,current_source_identities,current_material_identities,human_confirmation_ref,human_confirmation_sha256}`，任一不等于锁内重读 current 值即 `stale_source` 且零写。initial revision=1/open。合法 transition 在新 snapshot 中创建同 candidate 的 `revision=expected_revision+1` 新 record，旧 record 字节不改且投影 historical；普通 refresh 若 group 仍存在则创建新 snapshot record并继承 lifecycle 与 revision（不得递增），source/material identities 更新为本次 current；normalized payload 变化则是新 candidate_group_id/revision=1，不得冒充 transition。verified/rejected terminal；仅 current open/deferred 可按既定矩阵 transition/supersede。任何旧 snapshot、旧 record、旧 revision、旧 source/material authority 在 refresh 后都必须 stale；fixed tests覆盖 refresh继承、transition递增、旧授权拒绝。
  - **范围边界**：聚合刷新不得重写原始 stage-reflection 来源；verified 只表示候选被人接受进入验证，不表示业务收益已验证
  - **依据**：D-003、D-007
  - **场景**：SCN-001、SCN-008
  - **验收**：AC-POOL-003

- **FR-POOL-008**：候选刷新必须先校验全部输入并形成 `snapshot_content_id=hash(canonical input inventory)` 与完整待发布 snapshot，发布前重新计算 inventory hash。`publication_generation` 的唯一权威是同一 project lock 内重读到的 latest complete committed candidate snapshot：无 committed snapshot 时为 1，否则严格等于 current generation+1；torn/uncommitted tail 不占 generation，未知 schema、重复/跳号 generation 或 committed corruption 必须 fail-loud。每次 refresh 或 candidate transition publication 再以 `snapshot_content_id+attempt_id+publication_generation` 生成唯一 `snapshot_id`；generation 必须写入 batch begin/commit、snapshot records、`refresh_result` 与 publication-bound proof 的 canonical bytes。writer 在 commit 前必须重读 latest complete committed head 并确认其 snapshot_id/generation 仍等于分配 generation 时的 head，且 lock fencing 仍 current；不相等返回 `conflict|stale_source` 且零 append/零发布。`refreshEvolutionSnapshot({storageRoot,project,attemptId,inventory,now})` 不接受 manualRecovery；跨 boot authority 的唯一 semantic consumer 是 `acquireProjectLock({manualRecovery})`，explicit private CLI 只 parse 并原样转交该输入。每次 refresh 产生同时绑定 snapshot_content_id、snapshot_id、attempt_id、publication_generation、previous_snapshot_id、as_of、outcome、diagnostics 的 `refresh_result`；proof 也必须绑定两层 identity 与 generation。相同 inventory 可保持 content id，相同 as_of 的计算可 byte-equivalent，但新 publication 的 snapshot_id 仍唯一；as_of 变化必须改变时间投影，旧 snapshot_id/proof/refresh_result 在新 generation 下均 `stale_source`。pre-commit crash 不消费 generation；重试在新 lock/attempt 下重新从 committed head 分配。commit 已完整落盘但响应丢失时该 generation 已消费且成为 current；同 attempt 重试按 duplicate attempt 拒绝，新 attempt 只能分配下一 generation。它是本次 monitor 静态产物的生成输入，不是第四个项目级事实源。schema/hash/identity 冲突、重复冲突、必需输入损坏或读取期间来源变化时，outcome=failed，候选池不追加、不发布 current snapshot；已有合法 pool 保持字节不变。成功时一次追加完整 snapshot；消费者只接受整批校验成功的最新批次。
  - **范围边界**：失败不得用 last/first wins 吞掉冲突
  - **依据**：D-007、D-010
  - **场景**：SCN-008
  - **验收**：AC-POOL-005

- **FR-POOL-007 transition entrypoint**：deep module 唯一入口 `recordCandidateTransition`；CLI 必须传 current_snapshot_id、candidate_record_id、candidate_id、expected_revision、current source/material identities 与 human confirmation。refresh 继承 lifecycle/revision，transition 才 revision+1；旧授权 stale 正负例按上表校验。

### 5.2 前期质量税（TAX）

- **FR-POOL-008 identity refinement**：稳定 `snapshot_content_id=hash(canonical input inventory)`；`publication_generation` 在 project lock 内由 latest complete committed snapshot generation+1 唯一分配（初始 1），并写入 batch/snapshot/refresh_result/proof canonical bytes；commit 前重验 head snapshot_id/generation 与 fencing，竞争 loser 零写。发布 `snapshot_id=hash(snapshot_content_id,attempt_id,publication_generation)`，相同 inventory 可同 content id，但每次 publication snapshot_id 唯一。proof 与 refresh_result 同时绑定两层 identity 与 generation；相同 inventory+as_of 计算可 byte-equivalent但新发布 id不同，as_of变化改变时间投影；旧 proof/refresh_result/snapshot_id 在新 generation 全部 stale且零写。torn tail 不占 generation；pre-commit crash 后新 attempt 可复用尚未消费的 next generation，完整 commit 后 generation 永久消费；同 attempt retry 拒绝。`refreshEvolutionSnapshot` 不接受 manualRecovery；跨 boot只由 explicit CLI 调用 frozen export `acquireProjectLock`。

- **FR-TAX-001**：质量税定义为最近 30 天内“可确定归因于更早 stage 考虑不周的有效人工介入数 ÷ 全部有效人工介入数”；结果是观察占比，不是因果结论。
  - **范围边界**：不使用 token、耗时或 provider 数据
  - **依据**：D-006；2026-08-31 Clarify 2A、4A；PFACT-001、PFACT-004
  - **场景**：SCN-007
  - **验收**：AC-TAX-001

- **FR-TAX-002**：每次介入最多绑定一个 `primary_attribution_stage`；阶段顺序固定为 `make-decision < build-spec < build-plan < build-code < verify-code`。新归因只接受 `upstream_omission:<stage>` 精确语法；只有语法有效且归因 stage 严格早于介入 stage 才进入分子。多重、自由文本、未知 stage、同 stage、后续 stage 或缺失归因均进入 `unknown`，不得拆分或重复计数。
  - **范围边界**：未知介入仍进入分母并单列 unknown_count
  - **依据**：D-006；2026-08-31 Clarify 3A
  - **场景**：SCN-007、SCN-008
  - **验收**：AC-TAX-001、AC-TAX-002

- **FR-TAX-003**：质量税先把来源规范化为非持久 `tax-intervention.v1`：`intervention_id`、project、task_id、confirmation_ref、intervention_stage、occurred_at、step_slug、primary_attribution_stage、attribution_status、unknown_reason、source_ref、source_schema_version。`intervention_id` 由 project、task_id、confirmation_ref 唯一决定。确认文件必须存在且内容哈希、schema、task/stage/step 身份和 UTC 时间有效；同 identity 同值只计一次，不同值冲突时质量税整体 `unavailable`。旧确认可进入分母，但不满足新归因语法时只能进入 unknown；不回填、不让 AI 猜测。
  - **范围边界**：不新建遥测通道；只约束既有 intervention 事实的可消费语义
  - **依据**：R-012、R-013、D-006、D-008
  - **场景**：SCN-006、SCN-007
  - **验收**：AC-TAX-002

- **FR-TAX-004**：有效人工介入少于 5 次时，页面只显示 `insufficient_samples`、样本数和 unknown 数，不显示百分比或趋势方向；达到 5 次后才显示占比。
  - **范围边界**：最小样本以介入记录数计，不以任务数或 stage 运行数替代
  - **依据**：D-006；2026-08-31 Clarify 5A
  - **场景**：SCN-007
  - **验收**：AC-TAX-001、AC-TAX-003

- **FR-TAX-005**：confidence 必须由样本量与 `unknown_ratio=unknown_count/denominator` 确定性派生，比较时不得先四舍五入：分母小于 5 时 `sample_status=insufficient_samples` 且 confidence=`unavailable`；5～9 为 `low`；10 个及以上且 unknown_ratio=0 为 `high`；10 个及以上且 0<unknown_ratio≤20% 为 `medium`；10 个及以上且 unknown_ratio>20% 为 `low`。
  - **范围边界**：confidence 只描述口径可信度，不评价 WorkflowHub 质量
  - **依据**：D-006；PFACT-003
  - **场景**：SCN-007
  - **验收**：AC-TAX-003

- **FR-TAX-006**：质量税区块必须显著标注【未验证，待真实任务数据】；不得把占比下降解释成某次改动有效，也不得成为 stage gate、完成许可或自动优化输入。
  - **范围边界**：真实收益验证交给 DE-002
  - **依据**：D-005、D-006；PFACT-006
  - **场景**：SCN-001、SCN-007
  - **验收**：AC-GOV-002

- **FR-TAX-007**：30 天窗口按调用者传入并认证的 `as_of` 与确认记录 `occurred_at` 计算，`window_start=as_of-30d`、`window_end=generated_at=as_of`，不得隐式读取系统时钟。`readCurrentEvolutionProjection` 必须显式接收并重验 `{taxProjection,sourceInventoryHash,asOf,refreshResult}` 与 current candidate identity 属同 attempt/source/time；禁止内部重新读取这些来源或获取系统时钟。任一错配、来源损坏、identity冲突、时间无效或读取期间快照变化都返回 stale/unavailable 且零写，不得用剩余样本继续计算。
  - **范围边界**：状态区可显示损坏数量和原因，但不能显示比例
  - **依据**：D-006、D-010
  - **场景**：SCN-007、SCN-008
  - **验收**：AC-TAX-001～003

### 5.3 迭代简报（BRIEF）

- **FR-BRIEF-001**：用户必须明确项目和一个目标范围，目标类型仅允许 stage、step、skill 或 surface，四者恰好选一；系统按需生成单一 `iteration-brief.md`，不定时生成、不自动触发改动。
  - **范围边界**：简报是人工决策输入，不是第五份当前材料或新 stage
  - **依据**：D-001、D-008、D-009
  - **场景**：SCN-004、SCN-008
  - **验收**：AC-BRIEF-001

- **FR-BRIEF-002**：简报固定包含七区块：候选池两档、负例库、改动台账、外部 skill 更新检查、保留行为、当前未决 decision-log 项、市场对照槽位。
  - **范围边界**：区块不得被省略；市场对照只留槽位，不执行调研
  - **依据**：R-003、R-007、D-008、D-009
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-BRIEF-001、AC-BRIEF-002

- **FR-BRIEF-003**：候选、负例和台账只纳入与目标范围精确匹配或有显式引用关系的记录；保留行为与未决项只来自调用时绑定的当前 decision-log/spec 身份，不从历史材料或代码推断。
  - **范围边界**：缺当前材料身份时对应区块 unavailable，不猜测
  - **依据**：D-009、D-010
  - **场景**：SCN-004、SCN-005、SCN-008
  - **验收**：AC-BRIEF-002

- **FR-BRIEF-004**：外部 skill 更新检查只报告当前安装身份、可验证的上游版本/更新时间、检查时间和状态；网络或来源不可用时显示 `not_checked|unavailable`，不安装、不更新、不把“没查到”写成“没有更新”。
  - **范围边界**：不执行市场调研；不改变任何 skill
  - **依据**：D-008、D-009
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-BRIEF-002

- **FR-BRIEF-005**：简报只能呈现事实字段、判断身份、状态和证据引用；禁止方案文本、自动推荐改法、自动排序成决定、自动创建 task 或自动修改 harness/skill。
  - **范围边界**：`action_suggested` 只能原样解释为“值得验证”，不能扩写改法
  - **依据**：R-001、R-002、R-007、D-003、D-009
  - **场景**：SCN-004
  - **验收**：AC-BRIEF-003

- **FR-BRIEF-006**：目标或必需身份无效时生成失败且不覆盖既有简报；可选来源为空、过期或不可用时仍生成完整结构，并在区块内保留原因和整体 `degraded` 状态；取消时不发布新文件。
  - **范围边界**：部分结果不得伪装 complete
  - **依据**：D-009、D-010
  - **场景**：SCN-005、SCN-008
  - **验收**：AC-BRIEF-002

- **FR-BRIEF-007**：目标身份固定为六字段 `target-ref.v1={project_id,target_kind,target_id,target_version,authority_ref,authority_sha256}`：stage ID 仅允许五阶段 canonical ID；skill ID 必须绑定已注册 skill ID 与 current version；surface ID 必须来自 current governance entry，不接受自由文本、路径猜测或模糊匹配。记录只在六字段 canonical bytes 精确相等或 `related_targets[]` 显式包含该六字段 ref 时纳入。简报头必须绑定完整 target-ref、candidate snapshot_id、decision-log ref+sha256、spec ref+sha256、brief_attempt_id 与 generated_at。输出固定为项目存储根下单一 `iteration-brief.md`；同项目只有一个 current brief。每次生成使用不可复用 `brief_attempt_id` 与随机 `owner_token`，只可创建同项目目录内 `.iteration-brief.<attempt_id>.<owner_token>.tmp`；完整写入后 fsync temp、重验内容/来源 inventory/hash、重读 project_lock 并校验 owner_token+lease fencing，再原子 rename 到 current 路径并 fsync parent directory。并发 loser返回 `conflict`，来源漂移返回 `stale_source`；仅 rename 前 crash/取消保证旧 current 字节不变。rename 后若 directory fsync 失败返回 `durability_unknown`，不得宣称旧 bytes 不变或发布成功；恢复必须在 owner fencing 下重读 current hash，等于 intended hash 则幂等完成，否则保留 observed current 并以新 attempt、同 semantic id 重试。恢复只可清理由同 attempt+owner 命名且未成为 current 的 orphan temp，未知/他人 temp 禁止删除。
  - **范围边界**：简报不是追加历史账本；需要并存时由用户复制到项目外，不新增第二 current 投影
  - **依据**：D-001、D-007、D-009、D-010
  - **场景**：SCN-004、SCN-005、SCN-008
  - **验收**：AC-BRIEF-001～002

- **FR-BRIEF-008**：所有请求和可被简报消费的候选、attempted edit、negative result 必须使用同一六字段 target-ref，并允许 related_targets。target_kind 只允许 `stage|step|skill|surface`；skill target_version 必填，step target_version=versioned stage manifest version，stage/surface 固定 null。step 只由该 manifest 的唯一 step_slug→stage 映射解析；缺失/歧义 invalid。stage/step/skill/surface 分别由 manifest/manifest/catalog/move-map authority 解析；匹配只认 canonical JSON 全字段相等。
  - **范围边界**：不从路径、标题或自由文本反推 target
  - **依据**：D-007、D-009、D-010
  - **场景**：SCN-004、SCN-008
  - **验收**：AC-BRIEF-001、AC-BRIEF-002

- **FR-BRIEF-009**：七区块统一使用 `{section_id,status,reason_code,source_refs[],items[]}`；status 只允许 `ready|empty|unavailable|stale|not_checked|not_applicable`。empty 仅表示来源存在、身份/hash/schema 有效、扫描完整且匹配 0 条；读取失败、损坏或扫描不完整为 unavailable，身份漂移为 stale。来源白名单固定为：候选=current complete candidate snapshot；负例=negative-results 完整扫描；台账=attempted-edits 完整扫描；外部更新必须分别绑定 current installed skill 的 canonical identity/version/content hash/authority（catalog+bundle/ref）与真实 upstream check receipt，二者不得混为一个身份；installed/upstream 任一 mismatch 为 unavailable/failed，绝不伪造 ready；保留行为=当前 decision-log/spec 显式 preserve/non-goal/既有行为条目及 anchor；未决项=同一当前材料中未关闭的 OPEN/RISK/DE 条目及 anchor；市场槽位=DE-003 且固定 not_checked。非 skill 目标且无 related skill 时外部更新为 not_applicable；每个区块无论状态都必须保留并给出 reason/source。
  - **范围边界**：区块标题、空数组或读取失败都不能单独证明 empty
  - **依据**：D-008、D-009、D-010
  - **场景**：SCN-004、SCN-005、SCN-008
  - **验收**：AC-BRIEF-001、AC-BRIEF-002

### 5.4 改动台账（EDIT）

- **FR-BRIEF-007 durability refinement**：brief rename前失败零写；rename后 directory fsync失败返回 `durability_unknown`，不得宣称旧bytes不变或发布成功。恢复需在owner fencing下重读current hash：等于intended hash则幂等完成，否则保留observed current并以新attempt、同semantic id重试，禁止覆盖未知owner/current。

- **FR-EDIT-001**：每条 attempted edit 必须包含版本、唯一 edit_record_id、attempt_id、observed_at、decision_id、changed_surface、before_facts_ref、before_facts_sha256、before_observed_at、after_facts_ref、after_facts_sha256、after_observed_at、validation_method、outcome、revert_ref、evidence_refs 和 `supersedes`（首行必须为 null）；`record-evolution-result --record-kind=attempted-edit` 只接收并校验 current approved decision-log 的 ref+sha256+approval identity，不要求、不得消费 D24 boundary。任一必填字段缺失、decision_id 不属于该已批准 current decision、approval 缺失或 hash stale 时拒绝且零写；只有 `--record-kind=negative-result` 才必须额外绑定 current `d24-eval-boundary.v1` ref+frozen canonical bytes sha256+schema identity，错域/错 schema 时零写。
  - **范围边界**：decision_id 必须能回到当前项目已批准的 decision-log 条目
  - **依据**：R-005、D-004、D-009
  - **场景**：SCN-006、SCN-008
  - **验收**：AC-EDIT-001

- **FR-EDIT-002**：`outcome` 只允许 `improved|unchanged|regressed|inconclusive|reverted`；before/after 必须是两个可读、内容哈希匹配且不同的不可变事实快照，并满足 `before_observed_at < after_observed_at <= observed_at`（UTC）。顺序只认事实对象的 canonical observed_at，不得用 JSONL 行序、文件 mtime 或 ref 文本推断；`reverted` 必须有可读 revert_ref。
  - **范围边界**：台账保存观察结果，不把“improved”提升成发布或接受结论
  - **依据**：D-004、D-005
  - **场景**：SCN-006、SCN-008
  - **验收**：AC-EDIT-001、AC-EDIT-002

- **FR-EDIT-003**：系统不得自动挖掘历史 attempted edits；只有用户拍板后，由人或受委托 agent 在真实改动发生且验证达到终态后一次追加完整记录，既有行不可原地覆盖。每个 project+attempt_id 恰好一个 effective head；修正只能 supersede 当前 effective head，旧 head 变 historical 且链必须无环。重新实施或重试必须创建新 attempt_id，不得借 supersedes 改写实验事实；negative result 只能引用 effective edit head，且 edit outcome 必须与 failure_kind 相容。
  - **范围边界**：悬空、跨 attempt、跨 project、环形 supersedes 全部拒绝
  - **依据**：D-008、D-009
  - **场景**：SCN-006
  - **验收**：AC-EDIT-002

### 5.5 负例库（NEG）

- **FR-NEG-001**：每条 negative result 必须包含版本、negative_id、failure_identity、observed_at、decision_id、attempt_id、failure_domain、changed_surface、failure_kind、before_facts_ref、after_facts_ref、validation_method、failure_evidence_refs、revert_ref、status 和 supersedes。`failure_domain` 只允许 `harness|process|skill_edit`；`failure_kind` 只允许 `edit_validation_failed|preserve_behavior_regression|workflow_regression|revert_failed`。
  - **范围边界**：通用 execution failure、provider failure 和 eval result 不是允许的 failure_kind
  - **依据**：R-004、D-004
  - **场景**：SCN-006、SCN-008
  - **验收**：AC-NEG-001

- **FR-NEG-002**：分域权威固定为 T002 产出的 `runtime/schemas/workflow-evolution.v1.json#/$defs/d24_eval_boundary`：owner=`runtime/evidence/workflow-evolution.mjs` deep module；T002 必须冻结并 export exact anchor ref、canonical subschema UTF-8 bytes、这些 bytes 的 sha256 与 schema identity，fixture 保存 canonical_hex/hash fixed vector，T004 写 negative 前与 T010 aggregate 都逐字节复核；它是组合 schema 子定义，不是第五对象。分类顺序固定：输入/证据不足先返回 `classification_unavailable` 且不写；主失败对象属于 model、strategy、product、eval sample、dataset、provider-output-quality 或普通 task execution 时返回 `wrong_domain`、`target_domain=d24_eval` 与权威引用；仅当 changed_surface 属 `harness|process|skill_edit`，且独立 before/after 证据把失败归到该机制改动时，才写 M16。混合案例默认 D24；只有能隔离出不同 failure_identity 的机制失败才可另写 M16。M16 库内 failure_identity 必须唯一；D24/mixed 分类不得写 M16，任何 frozen bytes/hash/schema 漂移都零写。
  - **范围边界**：D24 存储与跨 M16/D24 的共享 claim authority 尚未定义，跨库 exactly-once 保持 deferred；本期不得宣称已证明跨库不双写
  - **依据**：R-004、D-004、D-008
  - **场景**：SCN-006、SCN-008
  - **验收**：AC-NEG-002

- **FR-NEG-003**：负例必须关联同一 attempted edit；没有有效 decision_id、attempt_id、失败证据或回退引用时不得落盘。成功、无变化或证据不足只留在 attempted edits，不伪造负例。
  - **范围边界**：负例行追加不可改写，修正通过 supersedes
  - **依据**：D-004、D-009
  - **场景**：SCN-006、SCN-008
  - **验收**：AC-NEG-001、AC-NEG-002

### 5.6 消融协议（ABL）

- **FR-NEG-002 writer refinement**：negative deep writer在同一project lock内读取current negative log/index，验证failure_identity全库唯一；supersedes仅可指同failure_identity的current effective head且链无环，悬空/跨identity/旧head/环全部零写。该读取是writer-side validation consumer；外部direct consumer仍只有iteration brief，move-map须登记此区别。

- **FR-ABL-001**：本期必须定义可复用消融记录合同：protocol_id、candidate_id、decision_id、hypothesis、control_facts_ref、treatment_facts_ref、preserve_behaviors、validation_method、success_oracle、failure_oracle、revert_condition、status 和 evidence_refs。
  - **范围边界**：本期只交付协议，不创建实验运行结果
  - **依据**：R-009、D-004、D-008
  - **场景**：SCN-004、SCN-006
  - **验收**：AC-ABL-001

- **FR-ABL-002**：所有 `classification=remove_candidate` 在候选池和简报中必须携带 `removal_status=pending` 并显示“待裁决”；本期 removal_status 不允许任何转换，不产生删除。未来批准转换、完整消融结果合同和删除执行全部属于 DE-001。
  - **范围边界**：action_suggested 也不是删除许可
  - **依据**：D-003、D-004、D-005
  - **场景**：SCN-002、SCN-004
  - **验收**：AC-ABL-002

- **FR-ABL-003**：未来消融必须显式验证 preserve behaviors，并可回到 before/after facts 与 revert_ref；本期不规定具体实验执行方式。
  - **范围边界**：执行与最终裁决属于 DE-001
  - **依据**：D-004、D-008、D-009
  - **场景**：SCN-004、SCN-006
  - **验收**：AC-ABL-001

### 5.7 只读趋势区（PAGE）

- **FR-PAGE-001**：现有 monitor 增加一个只读趋势区，不新增页面、服务、定时器或写入入口；既有任务视图、筛选和状态语义保持不变。
  - **范围边界**：趋势区只读，不执行简报或改动
  - **依据**：D-001、D-002；PFACT-002
  - **场景**：SCN-001、SCN-007
  - **验收**：AC-PAGE-001、AC-PAGE-002

- **FR-PAGE-002**：趋势区必须有“建议行动”“仅供参考”“前期质量税”三个可辨识区域；每条候选显示 stage、subject、分类、频次、priority_score、置信度、freshness、验证状态和安全证据引用。每档按 priority_score 降序、频次降序、recent_seen 降序、candidate_id 升序稳定排序；默认显示前 20 条，“显示更多”每次增加 20 条。证据链接的可访问名称必须包含 subject、来源任务和证据类型。
  - **范围边界**：可见标签不得使用“应删除”“已证明有效”
  - **依据**：D-002、D-003、D-006、D-010
  - **场景**：SCN-001～SCN-003、SCN-007
  - **验收**：AC-PAGE-001、AC-PAGE-003

- **FR-PAGE-003**：三个区域必须各自支持 default、empty、error、insufficient_samples、unavailable、stale 和 unverified 状态；这些状态在静态快照生成时确定，每种非默认状态显示原因，unknown 不补零。单一区域失败时，其他有效区域继续显示；整体摘要记 `partial`。只有顶层身份无效且三区域都不可置信时才显示整体 error。区域优先级为 error → unavailable → stale → insufficient_samples → empty → default，unverified 作为内容标签叠加而不覆盖数据状态。
  - **范围边界**：旧快照不得冒充当前数据；区域状态不得错误清空其他区域
  - **依据**：D-002、D-010
  - **场景**：SCN-001、SCN-005、SCN-007、SCN-008
  - **验收**：AC-PAGE-003

- **FR-PAGE-004**：趋势区必须可键盘访问，候选档位、状态和证据链接具有可读名称；证据链接 accessible name 必须机器断言精确包含 `subject=<subject_id>; task=<source_task_id>; evidence=<evidence_kind>`，折叠/展开控件必须断言 name=`展开全部证据`/`收起证据` 与 `aria-expanded=false|true` 同步；焦点顺序与视觉顺序一致；颜色不是唯一状态编码。正文对比度至少 4.5:1；大字、非文本控件和可见焦点至少 3:1。静态错误区显示“重新生成 monitor 数据并重新打开页面”的恢复说明；页面自身不得重读数据、重试、等待超时或后台刷新。
  - **范围边界**：沿用项目级视觉与无障碍规则；来源未绑定时保留 RISK-004
  - **依据**：D-002；PFACT-005
  - **场景**：SCN-001
  - **验收**：AC-PAGE-003

- **FR-PAGE-005**：窄屏下三区块纵向排列，候选字段不得横向溢出或隐藏状态；宽屏允许分栏，但阅读顺序保持“建议行动→仅供参考→质量税”。最小验收 viewport 为 390×844，宽屏为 1280×800；固定极端 fixture 至少包含 120 字符 subject、120 字符状态原因、5 个证据引用和多个状态标签。subject、状态和引用允许换行，不得被静默截断；视觉压缩时可折叠证据列表，但必须提供“展开全部证据”。
  - **范围边界**：不新增高级图表或可编辑控件
  - **依据**：D-002；PFACT-005
  - **场景**：SCN-001
  - **验收**：AC-PAGE-003

### 5.8 治理与诚实状态（GOV）

- **Brief consumer clarification**：current brief 的精确只读 consumer 是 T004 新增的 `generate-iteration-brief.mjs --read-current`；它校验 current brief identity 后 stdout 给用户，不新增 reader 文件，browser 不作为未定位的泛 consumer。

- **FR-GOV-001**：四个项目级持久对象是 `evolution-candidates.jsonl`、`attempted-edits.jsonl`、`negative-results.jsonl` 和单一 current `iteration-brief.md`。三个 JSONL 的 owner 为 M16 事实机制；按对象的真实 consumer 固定为 candidates→monitor 趋势区+iteration brief，attempted-edits→iteration brief + `record-evolution-result` negative-write effective-head validation，negative-results 的外部 direct consumer→iteration brief、内部 writer-side validation consumer→negative deep writer 在同一锁内读取 current log/index并校验 failure_identity/supersedes，replacement=none/append-only；brief 的 owner 为迭代简报 renderer，直接 consumer 固定为 `generate-iteration-brief.mjs --read-current`→identity validation→stdout→user，browser 只消费 static monitor，replacement=原子替换同项目 current 派生投影且不保留第二 current 或历史链。四者都不替代四份当前材料、task facts 或 review 事实；M16 退役时一起删除或只读归档。
  - **范围边界**：新增对象必须登记职责、consumer、owner、替代关系和删除条件
  - **依据**：D-007
  - **场景**：SCN-001、SCN-004、SCN-006
  - **验收**：AC-GOV-001

- **FR-GOV-003**：`docs/architecture/move-map.json` 只登记新增生产文件、生产命令、schema、四个持久 runtime object metadata，以及本期修改的生产 producer；build-code 最终确定的每个生产项必须在真实创建后、最终验收前有 `status=add|change` 或等价受校验条目，并明确 owner、真实 consumer、replacement（没有则 `none`）和 delete_condition。test-only RED wrapper/checker、browser fixture/checker、review/aggregate harness 与所有测试文件一律不进入 move-map，而由 fixture manifest 或对应 canonical gate evidence 跟踪。四对象条目描述稳定 logical path/schema/owner/consumer，不把 preflight temp path 当 repo file。生产项漏项、test-only 混入、planned-only/placeholder consumer 或字段缺失均不得验收；本 spec 不预先猜生产实现路径。
  - **范围边界**：move-map 是职责事实，不是新 gate、第五材料或继续工作的许可证
  - **依据**：D-007；项目宪法与当前治理边界
  - **场景**：SCN-001、SCN-004、SCN-006
  - **验收**：AC-GOV-001

- **FR-GOV-002**：聚合、投影和简报装配必须零 AI；所有 `unknown|unavailable|partial|incomplete|stale|insufficient_samples|unverified` 原样保留，不能转成成功、空 findings 或完成声明。
  - **范围边界**：审查 unavailable 时 build-spec/后续完成声明保持 incomplete
  - **依据**：D-005、D-008、D-010；PFACT-003、PFACT-004
  - **场景**：SCN-003、SCN-005、SCN-007、SCN-008
  - **验收**：AC-GOV-002

## 6. 模块划分

### 候选聚合

- **负责什么**：把合规复盘投影为两档候选与生命周期状态
- **对外提供什么**：项目级候选池与趋势区投影
- **依赖谁**：stage-reflection、消费边、人工介入事实
- **测试边界**：同一输入得到同一候选；unknown 不提升；重复记录不重复计数

### 趋势展示

- **负责什么**：在现有 monitor 展示候选和质量税
- **对外提供什么**：只读、可访问、响应式状态视图
- **依赖谁**：候选池、质量税投影、现有 monitor
- **测试边界**：既有任务视图无回归；所有状态可观察

### 迭代简报

- **负责什么**：按目标范围装配七区块事实简报
- **对外提供什么**：单一 Markdown 简报
- **依赖谁**：候选池、负例、改动台账、当前材料身份、外部更新事实
- **测试边界**：无方案文本；部分来源缺失仍诚实；无效必需输入不覆盖旧文件

### 负例、改动与消融合同

- **负责什么**：追溯批准、改动前后、验证、失败与回退
- **对外提供什么**：追加式 attempted edit、negative result 和消融协议记录
- **依赖谁**：当前 decision-log 决定与真实事实引用
- **测试边界**：必填字段、分域、引用、追加和 supersedes 规则可证伪

## 7. 关键实体

- **Evolution Candidate**：
  - **定义**：同一项目内，对一个 stage/step/skill 判断的跨任务聚合投影
  - **字段和约束**：见 FR-POOL-002～007；无自由文本方案
  - **关系**：引用多个 stage-reflection 来源，可被简报和页面消费

- **Quality Tax Projection**：
  - **定义**：30 天内上游归因人工介入占全部有效介入的观察比例
  - **字段和约束**：window_start、window_end、numerator、denominator、unknown_count、sample_status、confidence、generated_at、source_refs；window_end/generated_at 均绑定调用者认证 `as_of`
  - **关系**：只在 monitor 趋势区展示，不持久化为第二事实源

- **Attempted Edit**：
  - **定义**：一次经 decision_id 批准的真实改动尝试
  - **字段和约束**：见 FR-EDIT-001～003；追加式
  - **关系**：可被 Negative Result 和 Ablation Protocol 引用

- **Negative Result**：
  - **定义**：harness、process 或 skill edit 的失败尝试或回归事实
  - **字段和约束**：见 FR-NEG-001～003；禁止 D24 eval 域
  - **关系**：必须关联 Attempted Edit

- **Iteration Brief**：
  - **定义**：面向一个明确优化范围的只读事实装配
  - **字段和约束**：七个固定区块、整体状态、来源身份、生成时间
  - **关系**：消费候选、负例、台账和当前材料；不反写任何来源

## 8. 数据和生命周期

- **数据粒度**：候选池的一次发布是一个不可分割 snapshot 批次，批内每行代表一个聚合键的一个 revision；attempted edit 一行代表一次已终态验证的改动；negative result 一行代表一次失败或回归。
- **数据时效**：候选窗口与质量税窗口均为最近 30 天；每次 monitor 刷新生成同一快照投影。
- **缺失或迟到**：缺失显示 empty/unknown/unavailable；迟到来源下次刷新纳入，不追改已发布快照。
- **预览与正式**：趋势区是只读投影；JSONL 原始记录是持久来源；简报是一次性派生产物。
- **当前与历史**：JSONL 只追加且物理旧行不改写；消费者只选择最新完整已发布 snapshot，批内每个 candidate_id 恰好一个 active 投影，旧批次、旧 revision 和残缺尾批只作 historical 或忽略；原始来源不覆盖。
- **Crash recovery boundary**：ledger 只允许 append-only `batch_begin`→rows→`batch_commit(count+hash)`；`batch_abort` 不依赖可解析 batch_id，而认证 `last_committed_prefix_hash` 与从 `abandoned_start_offset` 开始的 `observed_suffix_length/hash`，因此覆盖 torn begin、torn row、torn commit。只有 terminal uncommitted suffix（无后续 batch）可直接忽略；一旦有后续 batch，前一 abandoned region 必须先由合法 abort 关闭；合法 abort region 可忽略，但已提交批次内 malformed row、count/hash/source identity 不一致必须 fail-loud，禁止 truncate/rewrite。
- **Lock restart authority**：`runtime/schemas/workflow-evolution.v1.json#/$defs/project_lock` 是 project lock 唯一权威 schema，固定字段集为 `schema_version/project/owner_token/pid/host_id/boot_id/session_epoch/acquired_monotonic_ms/lease_deadline_monotonic_ms`；禁止 host-only、缺 boot_id 或缺 session_epoch 的变体。仅同一 boot_id 与 session_epoch 内允许按 monotonic clock 判断过期并 stale reclaim；boot_id/session_epoch mismatch 默认 fail-loud。跨 boot reclaim 只接受 caller-owned ephemeral `manual-recovery.v1`：组合 schema `$defs.manual_recovery` 固定字段 `schema_version,current_lock_sha256,old_boot_id,new_boot_id,operator_identity,issued_at,nonce,confirmation_ref,confirmation_sha256`。唯一 semantic consumer 是深模块 `acquireProjectLock({manualRecovery})`；T004 的 record/brief 私有 CLI 可通过可选 `--manual-recovery=<json>` 只 parse 并原样转交，不能解释、验证或执行 recovery；page/check 默认不接收且 boot mismatch 保持 failed。深模块必须重验 current lock hash/boot/confirmation，原子 tombstone 记录 authority hash+nonce 后才 reclaim；nonce 对同 lock one-shot，missing/stale/replayed/cross-lock/cross-boot authority 全部拒绝且零写。该输入不持久化为第五对象，caller 负责保留/删除原件。
- **Lock export contract**：T002 frozen export `acquireProjectLock({storageRoot,project,attemptId,ownerToken,manualRecovery?})`；成功返回 `{lockHandle,ownerToken,fencingToken,leaseIdentity,release}`，错误=`failed|conflict|stale_source|replayed_recovery`且零reclaim/零写。它是manualRecovery唯一semantic consumer。candidate-transition CLI先acquire，再把handle/owner/fencing传给`recordCandidateTransition`重验；CLI仅parse/转交。
- **Lifecycle authority matrix**：initial `open`；open 可转 deferred/verified/rejected，deferred 可转 open/verified/rejected，且每次都必须绑定 current candidate_id/revision 的 human confirmation；verified/rejected terminal 且不可 supersede。仅 current open/deferred 可凭同样绑定的 human confirmation 转 superseded：旧 revision lifecycle=`superseded`、row=`historical`、immutable，新建同 candidate 的 revision+1 且 initial=`open`；无 authority、跨 candidate 或 stale revision 一律拒绝。
- **归属与清理**：项目级三个 JSONL 与单一 current `iteration-brief.md` 共四个持久对象位于全局项目存储根；分别按 FR-GOV-001 的 owner/consumer 管理，并在 M16 退役时一起删除或只读归档。

## 9. 兼容性预留

- **既有消费方**：现有 monitor 任务视图、stage-reflection 文件、lessons 和 task store 行为保持不变。
- **命名预留**：新持久记录有独立 schema_version；未知版本 fail closed。
- **容器预留**：可通过新版本增加事实字段；当前版本禁止自由文本方案和第二状态源。
- **状态预留**：业务 lifecycle 与 freshness 分离，避免把 stale 混入批准状态。
- **扩展边界**：未来可执行消融和市场调研，但本期不创建运行器、定时器、自动改动或 remove 裁决。

## 10. 明确不做与默认必须成立

### 明确不做

- 不重建 M15 遥测，不采集 token、耗时或 per-provider 数据。（R-013、D-008）
- 不自动修改 harness/skill，不替代用户或 decision-log 拍板。（R-001、R-007、D-008）
- 不改五阶段主骨架，不新增 stage、gate、定时器或消息控制面。（D-001、D-008）
- 不回填历史任务。（D-008）
- 不重复维护 D24 eval 失败案例库。（R-004、D-008）
- 不破坏任务视图，不创建独立新页面。（R-010、D-002）
- 不执行消融，不产生 remove 最终裁决。（R-009、D-004）
- 不实际执行市场对照调研，只保留槽位。（D-008、D-009）
- 不用本期结果证明 step/skill 必要性或人工介入已经减少。（D-005、D-006）

### 默认必须成立

- 判断始终标为 judgment；机器事实、推断和 unknown 不混写。（FR-POOL-003、FR-GOV-002）
- 所有证据引用保持 provenance；无引用不升级状态。（FR-POOL-004～006）
- 不可解析输入尽早失败；可选来源缺失则诚实降级。（FR-BRIEF-006、FR-GOV-002）
- 页面、简报、候选和台账均不能成为推进许可证。（FR-GOV-001～002）

## 10.1 UI Contract

### 页面或区域

- **page_or_region**：现有 WorkflowHub monitor 的只读趋势区
- **interaction_flow**：打开 monitor → 读取当前快照 → 先看建议行动 → 再看仅供参考 → 查看质量税与状态原因 → 沿安全引用核对来源
- **visible_labels**：`建议行动`、`仅供参考`、`前期质量税`、`判断，不是事实`、`待验证`、`样本不足`、`不可用`、`数据已过期`
- **constraints**：不增加写操作；不改变既有任务视图；状态不能只靠颜色；窄屏纵向排列
- **assumptions**：复用现有 monitor 的视觉、组件和安全引用规则
- **human_confirmation**：页面范围已在 make-decision 确认；视觉设计未获确认
- **current_material_ref**：当前 `decision-log.md` + 本 `spec.md`

### 状态矩阵

| name | interaction_flow | visible result | responsive | a11y |
| --- | --- | --- | --- | --- |
| default | 打开并浏览三区块 | 真实候选与质量税 | 宽屏分栏、窄屏纵排 | 标题层级、键盘可达 |
| empty | 无候选或介入 | 空态与来源覆盖 | 单列说明 | 不写“无问题” |
| error | 生成时判定区域快照无效 | 原位错误原因与静态恢复说明；有效区域保留 | 单列错误 | 错误摘要与恢复说明可读 |
| insufficient_samples | 少于 5 次介入 | 样本不足与样本数 | 不显示空图 | 文本解释阈值 |
| unavailable | 来源不可读 | 不可用与原因 | 对应卡片保留 | 不以灰色代替文字 |
| stale | 来源跨版本 | 数据已过期 | 对应卡片保留 | 状态进入可读名称 |
| unverified | 上游未真实验证 | 待验证，不给收益结论 | 标识不遮挡内容 | 标签非颜色唯一编码 |

### 设计来源事实

- **mode**：`legacy`
- **design_status**：`not_ready`
- **binding_state**：`not_bindable`
- **missing_items**：`DESIGN-SOURCE-PATH-MISSING`、`DESIGN-REVISION-MISSING`、`EXPERIENCE-SOURCE-PATH-MISSING`、`EXPERIENCE-REVISION-MISSING`、`DESIGN-SOURCE-MISSING`、`SCREEN-READ-MAP-EMPTY`
- **source_identities**：Design/Experience 的 path、hash、revision、owner、显式 anchor 均为 `unknown`
- **read_map**：空；无 Design.md，不能生成正式 Screen Read Map
- **freshness**：`unknown`
- **fallback_visual_basis**：仅允许复用现有 monitor 当前可读规则；不得借本任务创建第二设计系统
- **rework_risk**：来源不可绑定时，视觉一致性与具体 viewport 验收保持风险，不得宣称设计通过
- **fixture_refs**：`unknown — 当前只有测试动态临时数据，没有固定 M16 fixture`
- **viewport_refs**：`unknown — 只有响应式断点，没有目标 viewport 尺寸`
- **preview_refs**：`unavailable — 当前 worktree 没有已生成的 M16 monitor preview`
- **screenshot_refs**：`unavailable — 当前 worktree 没有 M16 截图证据`
- **short_design_prompt**：页面/区域、交互、状态、可见标签四行由 `buildShortUiDesignPrompt` 验证通过
- **design_loop_fact**：`preview_unavailable`；原因是没有当前 preview、fixture、viewport 或 screenshot；可见动作=`重新读取|生成设计提示词|继续并记录风险`；`gate=false`

## 11. 验收标准

- [ ] **AC-POOL-001**：固定输入两次生成字节等价的候选语义；聚合键、source identity 去重、异值冲突、frequency/min/max、severity max、priority sum、confidence worst、proof conflict=unknown 和引用升序均符合 FR-POOL-001～003。
  - **需求**：FR-POOL-001～003
  - **验证方法**：确定性契约测试
  判定：同输入同结果；同值来源折叠；每个多来源字段按唯一归并函数计算；无自由文本方案字段
  - **失败条件**：结果漂移、first/last wins、冲突被吞、重复计数、缺身份或出现方案文本
  - **证据类型**：`test`

- [ ] **AC-POOL-002**：两条独立样本分别证明“当前完整零消费 proof”与“跨两个不同任务重复介入”可单独进入建议行动；partial inventory、读取竞争、空输出集、stale proof、identity mismatch、一次介入、unknown 消费和仅判断只进入仅供参考。
  - **需求**：FR-POOL-004～005
  - **验证方法**：边界矩阵测试
  判定：两种强信号均可独立触发；弱信号不升级
  - **失败条件**：要求两强信号同时存在，或弱信号误升级
  - **证据类型**：`test`

- [ ] **AC-POOL-003**：30 天窗口、稳定 candidate_id、完整 snapshot 选批、current 批内每个 candidate_id 唯一 active row、revision、六维状态、人工 transition authority 和 supersedes 生命周期可回放。
  - **需求**：FR-POOL-006～007
  - **验证方法**：时间与生命周期契约测试
  判定：begin/row/commit 三个 tear point 均可由字节区间绑定的 batch_abort 关闭后开新批；旧物理行不改写且读取时 historical；open/deferred matrix 仅凭 current candidate/revision human confirmation 转换；仅 current open/deferred 可 supersede，旧 revision lifecycle=superseded/row=historical，新 revision+1 且 initial=open；verified/rejected terminal 且不可 supersede。
  - **失败条件**：abort 依赖可解析 batch_id、未认证字节区间后出现后续 batch、committed corruption 被忽略、重复 active/revision 回退、无 authority/跨 candidate/stale revision 转换或 supersede、verified/rejected 被 supersede、旧 revision 改写或来源覆盖
  - **证据类型**：`test`

- [ ] **AC-POOL-004**：lifecycle、row、freshness、evidence、sample、validation 六个维度及 unavailable、deferred、insufficient_samples、unverified、stale、unknown 均原样穿过候选、页面和简报，禁止通用 status 或跨维提升。
  - **需求**：FR-POOL-003、FR-POOL-005～006、FR-GOV-002
  - **验证方法**：状态传播测试
  判定：每种状态与原因可观察，未被补零或提升
  - **失败条件**：任一状态变成成功、空结果或完成结论
  - **证据类型**：`test`

- [ ] **AC-POOL-005**：malformed JSON、未知 schema、hash mismatch、identity mismatch、同 ID 冲突和扫描中来源变化均使刷新失败；同 attempt 的 `refresh_result` 绑定 monitor 静态产物；已有 pool 字节不变，没有旧 pool 时显示 unavailable；修复输入后只发布一个完整新 snapshot。`publication_generation` 初始为 1，之后只取锁内 latest complete committed generation+1；batch/snapshot/refresh_result/proof canonical bytes 必须一致绑定该值，commit 前重验 head。fixed vectors 覆盖初始发布、连续发布、同 content 双发布、两个 writer 从同一 head 竞争、torn tail、pre-commit crash 后新 attempt 重试、完整 commit 后响应丢失再重试；竞争或旧 head 必须零写。
  - **需求**：FR-POOL-008
  - **验证方法**：刷新事务与恢复测试
  判定：失败不追加、不发布半批；旧 snapshot 结合绑定 refresh_result 显示 stale/failed；残缺尾批永不成为 current且不占 generation；恢复后 snapshot_size/index/generation 完整，连续 complete commits 为 1..N 无重复/跳号
  - **失败条件**：损坏输入覆盖旧 pool、从旧 pool 猜失败、页面显示空候选、消费者读到半批、并发 writer 复用 generation、torn tail 消耗 generation、或 crash/retry 重复发布
  - **证据类型**：`test`

- [ ] **AC-TAX-001**：固定 `as_of` 的 30 天样本中，质量税按“唯一上游归因介入 ÷ 全部有效介入”计算；每次介入最多计一次；`window_start=as_of-30d`、`window_end=generated_at=as_of`，窗口起止、跨 reflection 重复 confirmation 和同 identity 冲突均可证伪；相同输入与相同 `as_of` 重复运行必须 byte-equivalent。
  - **需求**：FR-TAX-001、FR-TAX-002、FR-TAX-003、FR-TAX-004、FR-TAX-007
  - **验证方法**：构造样本算术测试
  判定：分子、分母、unknown_count 和比例与手算一致；同值重复折叠；冲突 identity 使整体 unavailable
  - **失败条件**：多重归因重复计数、unknown 被分摊、窗口错误或冲突时仍显示比例
  - **证据类型**：`test`

- [ ] **AC-TAX-002**：`upstream_omission:<stage>` 主归因按固定五阶段顺序解析；旧版本、自由文本、多重、未知 stage、同 stage 和后续 stage 归因全部进入 unknown，且不回填；无效 hash 和 task/stage/step 错配使比例 unavailable。
  - **需求**：FR-TAX-002、FR-TAX-003、FR-TAX-007
  - **验证方法**：归因语义矩阵测试
  判定：只有唯一更早 stage 进入分子
  - **失败条件**：系统猜测归因或改写旧记录
  - **证据类型**：`test`

- [ ] **AC-TAX-003**：4 个有效样本显示 `insufficient_samples` 且 confidence unavailable；第 5 个开始显示占比；10 个样本时 0%=high、10%=medium、20%=medium、30%=low，边界按精确分数比较。
  - **需求**：FR-TAX-004～005
  - **验证方法**：阈值与 confidence 边界测试
  判定：4/5/9/10 样本和 0%/10%/20%/30% unknown 边界准确
  - **失败条件**：不足 5 个显示趋势，或 confidence 超过允许级别
  - **证据类型**：`test`

- [ ] **AC-BRIEF-001**：stage、step、skill、surface 四种目标各用合法 `target-ref.v1` 生成一份含七个固定区块及真实内容/状态的简报；step 正例必须由 versioned stage manifest 的唯一 step_slug→stage 映射解析；多选、零选、unknown/ambiguous step、stale authority、authority/hash/version 缺失或失配均 fail-loud 且零发布。
  - **需求**：FR-BRIEF-001、FR-BRIEF-002、FR-BRIEF-007、FR-BRIEF-008、FR-BRIEF-009
  - **验证方法**：输入组合与结构测试
  判定：恰好一个六字段 canonical target ref 成功；stage/step/skill/surface 正例与全字段精确 target/related_targets 关系生效；step authority 唯一且 current；七区块 envelope、来源身份和允许内容齐全
  - **失败条件**：unknown/ambiguous/stale step authority、目标歧义、部分字段匹配、自由文本/模糊匹配仍生成、空标题冒充区块内容或任一区块缺失
  - **证据类型**：`test`

- [ ] **AC-BRIEF-002**：七区块分别覆盖 ready、empty、unavailable、stale、not_checked、not_applicable fixture；empty 仅在来源有效且完整扫描为零时成立；无效必需身份、stale source、取消和两个并发生成中的 loser 不覆盖既有简报。
  - **需求**：FR-BRIEF-002、FR-BRIEF-003、FR-BRIEF-004、FR-BRIEF-006、FR-BRIEF-007、FR-BRIEF-008、FR-BRIEF-009
  - **验证方法**：失败与恢复矩阵测试
  判定：每区块只消费白名单来源并保留 reason/source refs；可选缺失生成 degraded；必需输入失败保持旧文件字节不变；并发时仅一个 current brief
  - **失败条件**：读取失败标 empty、缺区块、越权来源、补造结果、CAS 失败仍覆盖旧文件或同时出现两个 current brief
  - **证据类型**：`test`

- [ ] **AC-BRIEF-003**：简报不含改法、自动决定、自动 task 或自动写操作；证据与判断身份可追溯。
  - **需求**：FR-BRIEF-003、FR-BRIEF-004、FR-BRIEF-005
  - **验证方法**：结构白名单与禁词语义审查
  判定：所有内容来自允许字段和当前来源
  - **失败条件**：出现“把 X 改成 Y”类方案、无来源建议或外部更新被自动应用
  - **证据类型**：`test`

- [ ] **AC-EDIT-001**：attempted edit 缺任一必填字段、decision_id 不可解析、事实 hash 不匹配、时间缺失/等时/逆序、试图用 mtime/行序定序或 reverted 无回退引用时拒绝写入。
  - **需求**：FR-EDIT-001～002
  - **验证方法**：schema 与引用负例测试
  判定：合法行追加，非法行不改变文件
  - **失败条件**：非法行落盘或覆盖既有行
  - **证据类型**：`test`

- [ ] **AC-EDIT-002**：台账仅在真实改动和终态验证/回退后追加；同 project+attempt 恰好一个 effective head，修正只 supersede 当前 head；重试创建新 attempt_id；悬空、跨 attempt、跨 project 和环形引用拒绝；outcome 不被提升为接受或发布事实。
  - **需求**：FR-EDIT-002、FR-EDIT-003
  - **验证方法**：生命周期测试
  判定：旧行保持字节不变，effective head 与替代链可回放，negative result 只引用相容的 effective head
  - **失败条件**：改动开始即写残缺行、修正旧 head 以外记录、用 supersedes 表示重试、原地改写、自动生成历史行或 outcome 改变治理状态
  - **证据类型**：`test`

- [ ] **AC-NEG-001**：合法 harness/process/skill_edit 失败必须关联有效 attempted edit、决定、证据和回退；缺任一项拒绝。
  - **需求**：FR-NEG-001、FR-NEG-003
  - **验证方法**：schema、引用和追加测试
  判定：合法负例追加且可追溯
  - **失败条件**：孤立负例、无证据负例或原地改写
  - **证据类型**：`test`

- [ ] **AC-NEG-002**：D24 eval、产品、模型、策略、数据集、provider 输出和普通 task execution 失败返回 wrong_domain；证据不足返回 classification_unavailable；有独立 before/after 因果证据的 tooling regression 才进入 M16；M16 库内同一 failure_identity 唯一，D24/mixed 分类不写 M16。
  - **需求**：FR-NEG-002～003
  - **验证方法**：mixed/provider-timeout/eval-harness/tooling-regression/证据不足/重复 claim 分类矩阵
  判定：分类顺序确定；仅三种允许域和四种 failure_kind 可落盘；M16-local identity 不重复
  - **失败条件**：模糊 mixed case 进入 M16、eval 失败进入 M16、证据不足仍落盘或 M16 库内 identity 重复
  - **证据类型**：`test`

- [ ] **AC-ABL-001**：消融协议 schema 覆盖 control/treatment、保留行为、成功/失败 oracle 和回退；本期没有实验运行或删除动作。
  - **需求**：FR-ABL-001、FR-ABL-003
  - **验证方法**：协议 schema 测试与范围审查
  判定：协议完整，执行对象为零
  - **失败条件**：协议缺可证伪 oracle，或本期创建实验执行/删除
  - **证据类型**：`test`

- [ ] **AC-ABL-002**：所有 `classification=remove_candidate` 固定携带 `removal_status=pending` 并显示待裁决；本期转换数和删除数都必须为零。
  - **需求**：FR-ABL-002
  - **验证方法**：状态转换负例测试
  判定：任何非 pending 输入、转换请求或删除请求均被拒绝且不落盘
  - **失败条件**：removal_status 改变，或候选、机器强信号、简报触发任何删除
  - **证据类型**：`test`

- [ ] **AC-PAGE-001**：同一 monitor 中可见建议行动、仅供参考、质量税三区块，候选字段和状态标签齐全。
  - **需求**：FR-PAGE-001～003
  - **验证方法**：页面结构与数据绑定验收
  判定：三区块读取同一当前快照，标签语义准确；档内排序与 20 条增量展开稳定；证据链接名称可区分
  - **失败条件**：新建独立页面、状态缺失或旧数据冒充当前
  - **证据类型**：`test`

- [ ] **AC-PAGE-002**：既有任务视图、筛选、安全引用和空/错状态回归保持不变。
  - **需求**：FR-PAGE-001
  - **验证方法**：既有 monitor 契约回归
  判定：既有合同全绿且输出语义无破坏
  - **失败条件**：任务视图字段、交互或状态发生非授权变化
  - **证据类型**：`test`

- [ ] **AC-PAGE-003**：default、empty、error、insufficient_samples、unavailable、stale、unverified 在 390×844 与 1280×800 均可读；三区块混合状态互不清空；键盘可达；对比度和可见焦点满足 FR-PAGE-004；极端 fixture 无静默截断或溢出；页面不存在数据重读、重试、timeout 或后台刷新动作。
  - **需求**：FR-PAGE-002～005
  - **验证方法**：组件/页面状态、响应式和无障碍验收
  判定：每种状态有文字和稳定阅读顺序；静态错误说明准确；有效区域在其他区域失败时继续显示
  - **失败条件**：横向溢出、状态只靠颜色、对比度不足、证据链接无可读名称、单一区域错误清空全页或页面新增运行时刷新逻辑
  - **证据类型**：`test`

- [ ] **AC-GOV-001**：`evolution-candidates.jsonl`、`attempted-edits.jsonl`、`negative-results.jsonl`、`iteration-brief.md` 四个持久对象及所有新增生产文件、命令、schema 均与 `docs/architecture/move-map.json` 双向一致，登记唯一 owner、真实 consumer、replacement 和 delete_condition；不新增第五材料或第二事实源。
  - **需求**：FR-GOV-001、FR-GOV-003
  - **验证方法**：治理清单与消费者核对
  判定：实现清单每项有 move-map add 条目，move-map 每个本任务 add 项都能回到实现；四个对象职责唯一、consumer 可定位
  - **失败条件**：任一方向漏项、placeholder consumer、字段缺失、无 consumer、双写、并行状态投影或永久兼容桥
  - **证据类型**：`evidence`

- [ ] **AC-GOV-002**：聚合、页面和简报零 AI；不重建遥测；所有不完整状态诚实；基础设施测试与独立审查完成后，业务收益仍标未验证。
  - **需求**：FR-POOL-001、FR-TAX-006、FR-GOV-002
  - **验证方法**：能力边界测试与独立审查
  判定：无 AI/provider 调用、无遥测字段、状态不提升；审查事实可追溯
  - **失败条件**：推断关键事实、伪造收益、审查 unavailable 却宣称 complete
  - **证据类型**：`evidence`

## 12. 风险、未决与交接

- **Decision/spec risk crosswalk**：`decision-log:RISK-001` → `spec:RISK-001`；`decision-log:RISK-002` → review-unavailable/incomplete（不得误作 `spec:RISK-002`）；`decision-log:RISK-003` → `spec:RISK-001` 的真实验证未完成面；`decision-log:RISK-004` → `spec:RISK-002`。引用必须保留材料前缀，禁止同号歧义。

- **RISK-001**：判断层自评偏袒与真实收益未验证
  - **受影响 ID**：PFACT-003、PFACT-006、FR-POOL-004～006、FR-TAX-006、AC-GOV-002
  - **触发条件**：用户把候选或质量税当作已证明改进
  - **后果**：错误优先级或过度修改
  - **缓解或 STOP**：两档分层、待验证标签、机器信号、remove 待裁决；不得宣称业务收益
  - **处理 Stage**：`build-code` 保证展示；后续真实任务验证
  - **验证**：AC-POOL-002、AC-POOL-004、AC-GOV-002

- **RISK-002**：共享 monitor 回归
  - **受影响 ID**：FR-PAGE-001～005、AC-PAGE-001～003
  - **触发条件**：趋势区改变既有任务视图或数据合同
  - **后果**：现有用户无法继续浏览任务复盘
  - **缓解或 STOP**：只读扩展；既有合同失败立即停止交付
  - **处理 Stage**：`build-code`
  - **验证**：AC-PAGE-002

- **RISK-003**：仓外追加文件损坏或并发冲突
  - **受影响 ID**：FR-POOL-001～007、FR-EDIT-001～003、FR-NEG-001～003
  - **触发条件**：并发写、半行、版本冲突或错误覆盖
  - **后果**：候选、负例或改动历史不可追溯
  - **缓解或 STOP**：build-plan 必须选择单一 writer、原子发布和 fail-closed 读取；不得用兼容桥吞错
  - **处理 Stage**：`build-plan`
  - **验证**：AC-POOL-001、AC-EDIT-002、AC-NEG-001

- **RISK-004**：UI 设计来源不可绑定
  - **受影响 ID**：PFACT-005、FR-PAGE-004～005、AC-PAGE-003
  - **触发条件**：缺唯一 Design.md/Experience.md、revision、anchor、fixture、viewport、preview 或 screenshot
  - **后果**：视觉一致性和响应式验收存在返工风险
  - **缓解或 STOP**：记录真实 missing/unknown；只复用现有 monitor；不宣称设计通过；build-plan 必须安排固定极端 fixture、390×844/1280×800 viewport、当前 preview、各状态截图，以及现有组件/token/variant 映射
  - **处理 Stage**：`build-spec` 记录事实，`build-plan` 制定最小验证
  - **验证**：UI 来源检查与 AC-PAGE-003

- **OPEN-UI-001**：项目级 UI 来源身份
  - **受影响 ID**：PFACT-005、FR-PAGE-004～005、AC-PAGE-003
  - **owner**：build-spec UI 来源检查
  - **影响**：当前已确认 `not_bindable`；具体视觉验收保持 RISK-004
  - **处理 Stage**：`build-spec`
  - **关闭条件或 STOP**：**本 spec 以缺失事实关闭**；不得把缺失改称设计通过，build-plan 只安排最小 fixture/viewport/preview 验证

- **DE-002**：真实任务收益验证
  - **受影响 ID**：PFACT-006、FR-POOL-006、FR-TAX-006、AC-GOV-002
  - **owner**：用户与后续真实任务
  - **影响**：无法证明必要性判断准确或人工介入减少
  - **处理 Stage**：后续任务
  - **关闭条件或 STOP**：真实任务积累后由用户重新开启 M16 并明确验证范围；本期保持未验证

- **DE-001**：执行消融与 remove 最终裁决
  - **受影响 ID**：FR-ABL-001～003、AC-ABL-001～002
  - **owner**：用户/后续任务
  - **影响**：remove_candidate 只能待裁决
  - **处理 Stage**：后续任务
  - **关闭条件或 STOP**：出现真实候选、批准 decision_id、完整 control/treatment 结果和保留行为证据

- **DE-003**：市场对照实际调研
  - **受影响 ID**：FR-BRIEF-002、FR-BRIEF-004、AC-BRIEF-002
  - **owner**：用户按需触发
  - **影响**：简报市场对照区只有槽位
  - **处理 Stage**：后续独立调研
  - **关闭条件或 STOP**：用户明确调研问题与来源边界；本期不得自动执行

## 13. 业务影响与回归范围

### stage-reflection 与 monitor

- **既有行为**：每个任务产出复盘；monitor 展示任务视图与 overall pending。
- **本需求影响**：增加项目级候选、质量税和趋势区，不改上游复盘语义。
- **回归路径**：空项目、单任务、多任务、损坏来源、过期来源、旧任务视图。
- **验收**：AC-POOL-001～004、AC-PAGE-001～003

### 人工优化流程

- **既有行为**：用户分散查找决定、判断和失败证据。
- **本需求影响**：按需得到七区块简报；改动和失败可追溯。
- **回归路径**：有效目标、目标歧义、可选来源缺失、取消、非法决定、D24 错域。
- **验收**：AC-BRIEF-001～003、AC-EDIT-001～002、AC-NEG-001～002

- **可能受冲击的业务规则**：judgment≠fact、unknown 不补零、review/test 不是推进许可证、四份材料唯一权威、reports immutable。
- **明确无影响**：五阶段顺序、任务视图、历史任务、M15 退役边界、D24 eval 失败案例库、close/release 授权流程。

## 14. build-spec Clarify 结果

spec-clarify: trigger = true, executed = true, reason = "OPEN-12～OPEN-15 会改变数据、验收与失败边界，已完成一批真实问答", open_direction_changing_questions = 0

- **trigger**：`true`
- **batch**：1
- **真实回复**：`1A 2A 3A 4A 5A`
- **关闭内容**：
  - OPEN-12：建议行动档采用“完整零消费证明 OR 跨两个不同任务重复介入”；聚合键、生命周期和 subject 映射见 FR-POOL。
  - OPEN-13：质量税为后期介入中上游主归因占比；唯一主归因；30 天；至少 5 次有效介入；confidence 规则见 FR-TAX。
  - OPEN-14：简报目标、七区块、来源、诚实降级和失败边界见 FR-BRIEF。
  - OPEN-15：负例字段与 D24 机器分域见 FR-NEG；attempted edit 归属见 FR-EDIT。
- **剩余方向性问题**：0
- **十维检查**：用户旅程、页面范围、数据/状态、成功、失败、角色/权限、外部影响、非目标、延期交接、验收证据均已覆盖。

## 15. build-spec 审查事实与处置

### UI design review

- **事实**：独立 plan-design-review 返回 6 条 finding；Design/Experience/fixture/viewport/preview/screenshot 缺失为真实 packet gap。
- **处置**：
  - 缺设计来源：`accepted_risk`，已写入 PFACT-005、RISK-004 和 build-plan 最小证据交接。
  - 三区块混合状态：`fixed`，见 FR-PAGE-003、AC-PAGE-003。
  - runtime 重试建议：`rejected_invalid`；静态页面无运行时数据重读，改为构建时 error 与静态恢复说明。
  - 对比度、焦点、可读标签：`fixed`，见 FR-PAGE-004、AC-PAGE-003。
  - 稳定排序、长列表、证据链接命名：`fixed`，见 FR-PAGE-002、AC-PAGE-001。
  - viewport 与极端 fixture：`fixed`，见 FR-PAGE-005、RISK-004、AC-PAGE-003。

### wh-review

- **transport**：`available` / `completed`；3 家异源 provider 完成；material_id=`df637a429973206434ede3479cf86fcb32c90ae4c68636a4d4c363f26b66f5db`。available 仅表示真实 findings 返回，不是通过。

| finding | severity | disposition | 修复位置 | 说明 |
| --- | --- | --- | --- | --- |
| confidence 中间区间（2 家重复） | major | fixed | FR-TAX-005、AC-TAX-003 | 完整五段函数 |
| DE 编号漂移 | minor | fixed | §12 | DE-002/003 对齐上游 |
| 静态页越界为 runtime 刷新 | blocking | fixed | FR-PAGE-003～004、AC-PAGE-003 | 删除重试/timeout/后台刷新 |
| 质量税输入不可重复计算 | major | fixed | FR-TAX-002～003、007、AC-TAX | 身份、语法、顺序、冲突 |
| 零消费 proof 不完整 | major | fixed | FR-POOL-004、AC-POOL-002 | current complete proof 才可触发 |
| 简报目标/身份/并发不明确 | major | fixed | FR-BRIEF-007、AC-BRIEF | canonical tuple 与 CAS |
| 候选 lifecycle 不完整 | major | fixed | FR-POOL-007、AC-POOL-003 | 四维状态与 authority |
| edit 缺 supersedes/时间权威 | major | fixed | FR-EDIT-001～003、AC-EDIT | 无环链与 canonical 时间 |
| D24 分域不可机器执行 | major | fixed | FR-NEG-001～002、AC-NEG-002 | classifier、precedence、claim |
| pool 刷新未 fail closed | major | fixed | FR-POOL-008、AC-POOL-005 | 保留旧 snapshot，拒绝半批 |

- **剩余 finding**：0 个未处置；RISK-004 与 DE-001～003 仍按事实保留，不冒充已解决。

### wh-review 最终复审

- **transport**：`available` / `completed`；3 家异源 provider 完成；material_id=`3f2d5c9f3727eecc7595b9c27d2116637d8feab8f8754cdb01bc4579bad43658`。以下 10 条均已在本版 spec 处置，正式 receipt 保留原始 finding，不以本表覆盖来源。

| finding_id | severity | disposition | 修复位置 | 说明 |
| --- | --- | --- | --- | --- |
| F-33298577a02d | blocking | fixed | FR-POOL-007～008、AC-POOL-003～005 | 完整 snapshot、读取投影、绑定刷新结果 |
| F-15f5667808bf | major | fixed | FR-NEG-002、AC-NEG-002 | 收窄为 M16-local 唯一性 |
| F-4e486871b311 | major | fixed | FR-BRIEF-008、AC-BRIEF-001～002 | 统一六字段 TargetRef |
| F-5dca31a51fd7 | major | fixed | FR-POOL-003、AC-POOL-001 | 确定性多来源归并 |
| F-6c6f571bd7f6 | major | fixed | SCN-006、FR-EDIT-003、AC-EDIT-002 | 仅终态写 attempted edit |
| F-b0802e1dfda8 | major | fixed | FR-GOV-001、AC-GOV-001、§8 | 四个持久对象完整治理 |
| F-b1e71cc7ade9 | major | fixed | FR-POOL-003、FR-ABL-002、AC-ABL-002 | remove_candidate 固定 pending |
| F-e42d71cd4248 | major | fixed | FR-BRIEF-009、AC-BRIEF-001～002 | 七区块 envelope、白名单与空值语义 |
| F-eea9331d9f1a | major | fixed | FR-POOL-006、AC-POOL-004、AC-PAGE-003 | 六维状态与统一枚举 |
| F-c100448910b5 | minor | fixed | FR-GOV-003、AC-GOV-001 | move-map 双向可证伪 |

- **最终复审剩余 finding**：0 个未处置；这只表示 review finding 已处置，不替代 Clarify 回执、测试、接受或发布事实。
