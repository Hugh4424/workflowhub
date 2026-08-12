# 功能规格：WorkflowHub 流程退化与成本监控页

- **content_profile**：`spec-content.v3`
- **功能名**：流程退化诊断、质量事实与成本监控
- **来源**：已确认的 `decision-log.md`（R-001～R-016，D-001～D-013）
- **状态**：草稿

## 速读卡（30 秒）

- **一句话需求**：WorkflowHub 维护者需要用一个无需服务的静态页面，看清所有 project/task 是否按固定流程执行、证据缺在哪里、成本集中在哪里，并能回到受控来源核实。
- **核心改动点**：
  - 修通 M15 实际消费所需的任务事实与当前 Codex transcript 采集链。
  - 从 task 事实生成 project 投影、全局扁平事实和静态页面数据。
  - 用单页四区展示流程退化、成本、问题聚合与趋势。
- **最大影响面**：任务事实合同、Codex 来源登记、跨 project 派生数据和本地静态监控体验。
- **验收信号**：至少一个 fresh Codex 真实任务能从五阶段执行事实一路显示到静态页面，并且任何缺失、冲突、陈旧或非法输入都呈现为正确状态。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001～R-004 | D-001～D-013 | 全部 FR / AC | current / 完整规格 | 不得由下游补方向 |
| R-005、R-009、R-015 | D-003、D-012、D-013 | FR-FACT-001～004、FR-E2E-001 | current / 事实生产链 | 完整 skills inventory 仍归 M14b owner |
| R-006、R-010 | D-001、D-002、D-006、D-013 | FR-DIAG-001～003 | current / 诊断 | 不输出修法或质量分 |
| R-007、R-013 | D-007、D-008、D-011 | FR-VIEW-001～003 | current / 单页四区 | 候选池延期 M16 |
| R-011、R-012 | D-006、D-009～D-011 | FR-COST-001～003 | current / 成本与趋势 | 多 CLI 延期 M17 |
| R-014、R-016 | D-012、D-013 | FR-FACT-002～004、FR-PROJ-001～003 | current / 归属与版本 | 精确工程结构交 build-plan |
| R-008 | D-001、D-013 | PFACT-006、FR-FACT-003 | evidence-only / M0 教训 | 不是 gate |

## 1. 问题与紧迫性

当前运行时虽然有 task、材料和质量记录，但 M15 所需的 step、skill、session、subagent、token、duration、retry、tool use、自动化和人工介入事实没有一条可用的真实生产链。现有来源登记为空，历史 M14b 产物也没有形成可消费样本。若直接做页面，只会交付一个大量空值、甚至错误归因的空壳。

本需求必须先把页面实际需要的事实链修通，再交付监控页。用户得到的是可核实事实，不是自动优化器：页面帮助发现问题，但不替用户判断改法，也不阻断任务执行。

## 2. 背景、目标与范围

### 背景

WorkflowHub 的标准流程固定包含五个 stage。每个 stage 的 step 必须留下 outcome；skill 是否执行由 trigger 决定，`trigger=false` 必须有理由。M15 对 expected topology 和 observed facts 做确定性对照，并继承 M14a 的 failure taxonomy、字段归属思想和 contract/collector 分版规则。

最窄可交付方向不是“先做空页面”，因为真实 producer 缺失会让核心用户结果不可验证；也不是启动本地服务或一次接完多 CLI，因为前者增加维护面、后者吞并 M17。当前方向只修 Codex + canonical task facts 的真实消费链，再用可重建静态投影发布， premise 是 launcher 能为 fresh Codex task 提供精确来源绑定；做不到时必须保持 unknown/incomplete，不能降级为目录猜测。

### 目标

- 维护者能从全局、project、task、stage、skill、session 和 subagent 角度查看流程与成本事实。
- 每项诊断都能回指受控 fact/source/session/artifact 引用。
- missing、unknown、partial、stale、conflict 和 insufficient samples 不会被写成 0 或成功。
- 页面无需本地服务；task 正常执行时自动更新派生数据，用户重新打开或手动刷新浏览器后看到最新快照。

### 范围内

- 修复 M15 所需的 transcript、artifact、flow-health 事实生产与索引职责。
- 只接 canonical task/material/quality 事实和 launcher 显式登记的当前 Codex transcript。
- 生成 task supporting evidence、project 每-task 投影、全局扁平 JSONL、data.js 和固定静态 HTML。
- 诊断 stage 证据断链、step outcome、skill trigger/execution、required artifact、taskPath、worktree、review、verify、handoff 和 transcript 完整性。
- 展示成本排行、自动化率、人工介入、版本对比、事实问题聚合和趋势。

## 3. 用户场景与状态覆盖

### SCN-001：fresh Codex 任务产生可观测事实

- **角色**：WorkflowHub 维护者
- **Given**：launcher 已把当前 Codex session 与 task/run 明确绑定
- **When**：任务执行 stage、step、skill、review 和 verify
- **Then**：任务事实和 supporting evidence 被可靠记录，派生投影更新且不反向影响任务执行

### SCN-002：打开监控页查看最新快照

- **角色**：WorkflowHub 维护者
- **Given**：全局 data.js 已存在且合同兼容
- **When**：用户打开静态 HTML，或在任务更新后手动刷新浏览器页面
- **Then**：页面读取一次当前快照，默认进入任务总览并显示所有 project 的最近快照；共享筛选在四区切换时保留，页面打开期间不轮询、不自动刷新

### SCN-003：核查流程是否按标准发生

- **角色**：WorkflowHub 维护者
- **Given**：expected manifest 与 observed facts 可用
- **When**：用户查看流程退化区
- **Then**：页面区分 future stage pending、stage 证据断链、step missing/out-of-order/skipped/not-applicable，以及 required skill 漏执行或合法 trigger=false

### SCN-004：查看成本与归属

- **角色**：WorkflowHub 维护者
- **Given**：Codex transcript 中存在可验证 usage、duration 或 tool event
- **When**：用户按 transcript、session、stage、skill 或 subagent 排序
- **Then**：页面显示 token、duration、retry、tool use 的事实排行和来源状态，不把高成本自动标为浪费

### SCN-005：普通来源缺失或单条损坏

- **角色**：WorkflowHub 维护者
- **Given**：来源未登记、文件不存在、格式暂不支持或个别记录损坏
- **When**：采集和投影继续处理其余合法记录
- **Then**：结果为 missing、unknown 或 partial，并显示 coverage 与 errors；合法记录仍可查看

### SCN-006：身份、安全或顶层合同错误

- **角色**：WorkflowHub 维护者
- **Given**：出现路径逃逸、来源身份错误、task/run/session 绑定冲突、隐私越界或顶层合同不兼容
- **When**：采集器或 projector 校验输入
- **Then**：当前生成动作 fail-loud，指出错误范围，不发布伪完整的新快照

### SCN-007：多个 task 同时更新

- **角色**：WorkflowHub 运行时
- **Given**：多个 task 并发完成事实写入
- **When**：project 与全局投影发生竞争
- **Then**：每 task 投影互不覆盖；全局发布只出现完整旧快照或完整新快照，不出现半写或丢失数组项

### SCN-008：旧 task 没有历史 transcript

- **角色**：WorkflowHub 维护者
- **Given**：旧 task 只有部分材料和质量事实
- **When**：页面汇总该 task
- **Then**：可用事实照常显示，不可恢复部分显示 partial/missing，不要求迁移或伪造历史

### SCN-009：查看版本对比与趋势

- **角色**：WorkflowHub 维护者
- **Given**：至少两个兼容版本或时间桶有完整分母
- **When**：用户选择版本或时间范围
- **Then**：页面展示可比事实；合同、来源、grain 不兼容或样本不足时显示 mismatch/insufficient_samples

### SCN-010：project/root 投影失败

- **角色**：WorkflowHub 维护者
- **Given**：canonical task facts 已写成功，但派生发布失败
- **When**：用户打开旧页面快照
- **Then**：任务事实不回滚，旧快照仍可读并明确显示 stale、generated_at、coverage 和 projection error

### SCN-011：核查来源但不泄露私有数据

- **角色**：WorkflowHub 维护者
- **Given**：诊断来自 Codex transcript 或质量记录
- **When**：用户查看来源详情
- **Then**：只看到 opaque source/session/fact/artifact 引用和 coverage，不看到 raw realpath、raw transcript、broker state 或 provider 私有 session

### SCN-012：真实完成验收

- **角色**：验收者
- **Given**：一个 fresh Codex 真实任务按标准五阶段执行
- **When**：验收者从任务事实追到静态页面
- **Then**：所有已承诺事实类别和错误状态都可被真实证据判定；fixture 只能补边界测试，不能替代这条真实链

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-002
- [x] **空态**：SCN-008；合法无匹配记录显示 empty valid
- [x] **错误态**：SCN-005、SCN-006、SCN-010
- [x] **加载态**：SCN-002；页面加载 data.js 前显示正在读取，读取结束转 ready/partial/error
- [x] **取消态**：N/A — 页面没有长任务或写操作，关闭页面不影响 task/projector
- [x] **边界态**：SCN-008、SCN-009
- [x] **权限态**：SCN-006、SCN-011；不可读或越界来源不能降级成成功
- [x] **竞态**：SCN-007

### 页面状态与恢复

- **loading**：显示“正在读取本地快照”，不显示旧数字冒充当前；读取完成后切换到 ready/empty/partial/stale/fatal。
- **ready**：显示 generated time、coverage 和当前共享筛选；用户从任务总览进入某 task 的退化或成本区时，自动带入该 task 筛选并保留其他兼容筛选。
- **empty valid**：说明“当前筛选没有记录”，提供清除筛选回到默认范围；不得显示“零问题”。
- **partial**：保留合法事实，错误摘要位于结果前；说明哪些来源缺失，以及“上游任务/投影更新后手动刷新浏览器”才能重读。
- **stale**：保留旧事实和旧 generated time；明确浏览器刷新不能修复尚未恢复的 projector，须等待上游重新发布后再刷新。
- **fatal**：data.js 缺失、合同不兼容或安全/身份错误时不显示伪完整事实；错误摘要显示在结果前，说明需要上游发布兼容快照后再刷新浏览器。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：当前 canonical task fact 合同不能承载 M15 的事实类别。
  - **status**：`verified`
  - **证据或来源**：SRES-001；decision-log F-003、D-003、D-013
  - **关联**：FR-FACT-001、AC-FACT-001

- **PFACT-002**：当前生产 transcript/runtime source registry 没有真实来源。
  - **status**：`verified`
  - **证据或来源**：SRES-003、SRES-004；decision-log F-003
  - **关联**：FR-SOURCE-001、AC-SOURCE-001

- **PFACT-003**：M14a 已定义封闭 failure taxonomy、字段归属和 contract/collector 分版语义，但它是显式复用的历史契约来源，不是当前 active runtime 自动保证。
  - **status**：`verified`
  - **证据或来源**：SRES-002；decision-log R-009、R-014、R-016、D-013
  - **关联**：FR-FACT-002、FR-DIAG-002、AC-FACT-002、AC-DIAG-002

- **PFACT-004**：task facts 和 quality facts 已有不同 owner；M15 只能观察 review/test/verify，不得复制其原始权威。
  - **status**：`verified`
  - **证据或来源**：SRES-001、SRES-004；D-012、D-013
  - **关联**：FR-FACT-003、AC-FACT-003

- **PFACT-005**：普通 file 页面不能可靠 fetch 或枚举本地目录，但可以读取一个已知同级 classic data.js。
  - **status**：`verified`
  - **证据或来源**：decision-log F-004、D-008；隔离浏览器实测
  - **关联**：FR-PROJ-003、FR-VIEW-001、AC-PROJ-003、AC-VIEW-001

- **PFACT-006**：旧 metering/observability 包含混合活路径、孤儿路径和两条可能不一致的 worker token 来源。
  - **status**：`verified`
  - **证据或来源**：decision-log F-002；M0 metering/observability/delegation-metrics
  - **关联**：FR-COST-001、FR-COST-002、AC-COST-001、AC-COST-002

- **PFACT-007**：当前 Codex transcript 可观察到 session、usage、tool 和完成时长，但其文件形状不是稳定 WorkflowHub 合同。
  - **status**：`inferred`
  - **证据或来源**：decision-log F-005、D-010；限制是只代表当前 Codex Desktop 形状
  - **关联**：FR-SOURCE-002、FR-COST-001、AC-SOURCE-002、AC-COST-001

- **PFACT-008**：页面刷新模式是打开或手动刷新浏览器时读取一次，不做页面内刷新。
  - **status**：`verified`
  - **证据或来源**：spec-clarify 用户回复：`C，手动刷新页面也可以`
  - **关联**：FR-VIEW-002、AC-VIEW-002

- **PFACT-009**：完整 skills inventory 仍是未兑现的 M14b 独立输出，但不是 M15 页面最小消费链。
  - **status**：`verified`
  - **证据或来源**：decision-log R-015、DEF-004；SRES-004
  - **关联**：FR-E2E-001、AC-E2E-001

## 5. 功能需求

### 来源登记与采集（SOURCE）

- **FR-SOURCE-001**：每次受支持的 WorkflowHub invocation 开始前，launcher 必须显式登记唯一来源身份、opaque public ref、精确 transcript realpath、read capability、source/format/schema/CLI/adapter 版本、task/run/session 绑定、required 语义和登记身份；禁止目录扫描或按时间/cwd 猜测来源。
  - **范围边界**：realpath 与 read capability 只存在于受控 adapter 私域；公开事实不包含它们。
  - **依据**：D-004、D-010；PFACT-002
  - **场景**：SCN-001、SCN-006、SCN-011
  - **验收**：AC-SOURCE-001

- **FR-SOURCE-002**：Codex adapter 只解析声明支持的格式与版本；未登记、找不到、读失败、格式不支持、单行损坏和重复 ID 冲突必须按已定状态报告，并附 coverage/error，不得静默丢弃。
  - **范围边界**：本期不实现 Claude 或其他 CLI adapter。
  - **依据**：D-004、D-005、D-010、D-013；PFACT-007
  - **场景**：SCN-005、SCN-006、SCN-008
  - **验收**：AC-SOURCE-002

### 单一事实与合同（FACT）

- **FR-FACT-001**：`facts.jsonl` 是新运行事实的唯一权威。旧 v1 facts 保持可读；M15 新事实使用版本化、严格判别的事实合同，包含事实类型、grain、source、status、coverage、归属键和 typed value/reason，禁止任意 payload。
  - **范围边界**：present 才能携带 typed value；missing/unknown 必须携带 reason 或 error。
  - **依据**：D-012、D-013；PFACT-001
  - **场景**：SCN-001、SCN-005、SCN-008
  - **验收**：AC-FACT-001

- **FR-FACT-002**：M15 必须显式继承 M14a 的封闭 failure taxonomy：`task_dir`、`worktree`、`review`、`verify`、`handoff`、`transcript`、`skill_missing`、`artifact_missing`、`token_waste`。每个新增字段必须登记 producer/owner、可信来源、消费视图和版本；schema version、collector version、supported schema range、adapter version 和 skill version 必须分开。
  - **范围边界**：不得修改历史 archive 来制造当前权威；新增语义必须形成新合同版本。
  - **依据**：D-013；PFACT-003
  - **场景**：SCN-003、SCN-009
  - **验收**：AC-FACT-002

- **FR-FACT-003**：review、test、verify 原始记录继续由 quality owner 持有；M15 facts 只记录 invoked、independent、outcome、freshness、绑定、source ref 与 coverage。全局 index 只保存 schema/version/ref/hash，不复制事实语义。
  - **范围边界**：provider 失败是 unavailable，不得改写为“无问题”或 false。
  - **依据**：D-001、D-012、D-013；PFACT-004
  - **场景**：SCN-003、SCN-005
  - **验收**：AC-FACT-003

- **FR-FACT-004**：事实聚合保留 `source + skill_id + version` 身份与明确 grain；缺 skill/version 时保持 unknown。task facts、Codex transcript 或其他已登记来源对同一 grain 冲突时分别保留 source 并标 conflict，禁止静默择值或相加。
  - **范围边界**：producer 是公共旁路能力，不给每个 skill 新增机器入口。
  - **依据**：D-006、D-012、D-013；PFACT-006
  - **场景**：SCN-004、SCN-005、SCN-009
  - **验收**：AC-FACT-004

### 流程退化诊断（DIAG）

- **FR-DIAG-001**：诊断必须对照固定五阶段、当前 stage step manifest 和 skill trigger contract：future stage 是 pending；后续 stage 有事实而前置 stage 无事实才是 stage evidence gap；每个 step 必须有 outcome；skill 仅在 trigger=true 且无 executed/unavailable truth 时标缺失，trigger=false 必须有 reason。
  - **范围边界**：合法 skipped/not-applicable 不等于缺 stage。
  - **依据**：D-002；PFACT-003
  - **场景**：SCN-003、SCN-008
  - **验收**：AC-DIAG-001

- **FR-DIAG-002**：failure domain 只能从 M14a taxonomy 和结构化 facts 派生；当前 `taskPath` configured/used 缺口映射到历史合同枚举 `task_dir`。九个领域都不得携带 severity、root cause、质量分或修改建议。
  - **范围边界**：未知来源不能被 tagger 猜成某个 domain。
  - **依据**：D-001、D-013；PFACT-003
  - **场景**：SCN-003、SCN-005
  - **验收**：AC-DIAG-002

- **FR-DIAG-003**：所有诊断结果必须显示 status、coverage、errors 和受控证据引用；missing、unknown、false、partial、stale、conflict、invalid input、empty valid 与 insufficient samples 语义互不替代。
  - **范围边界**：阈值仅供人判断，不阻断任务。
  - **依据**：D-005、D-011；PFACT-004
  - **场景**：SCN-005、SCN-006、SCN-008、SCN-010
  - **验收**：AC-DIAG-003

### 成本与趋势（COST）

- **FR-COST-001**：成本事实按 transcript、session、stage、skill、subagent 显示 token、duration、retry 和 tool use；token 按 message ID 去重，tool use 按 tool-use ID 去重，retry 只认明确 attempt/retry identity，duration 只认明确值或同 ID start/end。
  - **范围边界**：禁止从文件时间、相似文本或工具名猜耗时和 retry。
  - **依据**：D-006、D-009、D-013；PFACT-006、PFACT-007
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-COST-001

- **FR-COST-002**：高 token、长 duration 或高 retry 只作为成本排行；`token_waste` 仅在去重合同证明重复计数，或已登记来源明确证明动作冗余时派生。
  - **范围边界**：均值、固定阈值或 LLM 判断不能标 waste。
  - **依据**：D-006；PFACT-006
  - **场景**：SCN-004
  - **验收**：AC-COST-002

- **FR-COST-003**：自动化率只使用同一筛选范围内有明确 origin 的可核实动作作分母；人工介入只计明确 reply、approval、override、request 或 human-origin action。`review_invoked`、`verify_fresh`、自动化率和人工介入可按 task/stage 看趋势；趋势至少需要两个兼容时间桶且各桶分母可用。常见问题只按 `failure_domain`、`friction_type`、`error_code` 确定性聚合，count 小于 2 不称“常见”。
  - **范围边界**：分母缺失时 automation rate 为 unknown。
  - **依据**：D-011；PFACT-004
  - **场景**：SCN-009
  - **验收**：AC-COST-003

### 派生发布（PROJ）

- **FR-PROJ-001**：task canonical facts 成功后，project projection 为每个 task 生成独占、可重建的派生记录；project/task identity、schema、source refs、coverage、errors 和 generated time 必须可校验。
  - **范围边界**：project projection 不能用于 task discovery、身份判断、流程推进或反写 task。
  - **依据**：D-007、D-008、D-012；PFACT-004
  - **场景**：SCN-001、SCN-007、SCN-010
  - **验收**：AC-PROJ-001

- **FR-PROJ-002**：全局 projector 只扫描派生 monitoring namespace，在全局锁内全量重建 derived flat JSONL 与 data.js；发布必须是完整旧快照或完整新快照。投影失败不回滚 canonical facts。
  - **范围边界**：禁止多 task 增量修改共享数组；全局输出不是 task index。
  - **依据**：D-008、D-012、D-013；PFACT-005
  - **场景**：SCN-007、SCN-010
  - **验收**：AC-PROJ-002

- **FR-PROJ-003**：data.js 使用固定数据赋值和安全序列化，暴露 schema、generated time、coverage、errors 与 stale/partial 状态；页面不得把来源文本当可执行代码或未经转义的 HTML。
  - **范围边界**：不使用本地服务、目录选择器或 file fetch 作为主路径。
  - **依据**：D-008；PFACT-005
  - **场景**：SCN-002、SCN-006、SCN-011
  - **验收**：AC-PROJ-003

### 静态监控体验（VIEW）

- **FR-VIEW-001**：固定静态 HTML 提供四个可切换区：任务总览、流程退化、成本归因、常见问题与趋势；支持全局、project、task、stage、skill、version 和 time-window 筛选，并显示 outcome/process/efficiency 分类。
  - **范围边界**：首次打开默认任务总览、所有 project、最近快照；筛选为四区共享状态，切区保留，浏览器刷新重置默认。任务总览可带 task 筛选下钻到退化/成本区。版本对比只比较 schema、来源、`source+skill_id+version`、grain 和 coverage 兼容的范围；不可比显示 mismatch 或 insufficient_samples。证据链接只打开受控引用。不提供任务管理、设置、编辑、修复、候选优先级或质量评分。
  - **依据**：D-001、D-007、D-008、D-011；PFACT-005
  - **场景**：SCN-002、SCN-003、SCN-004、SCN-009
  - **验收**：AC-VIEW-001

- **FR-VIEW-002**：页面只在打开时读取 data.js 一次；任务更新后，用户通过浏览器原生手动刷新页面读取新快照。页面内不轮询、不自动重载、不提供自定义刷新按钮。
  - **范围边界**：刷新后可恢复默认筛选；不承诺保存刷新前的临时 UI 选择。
  - **依据**：spec-clarify；PFACT-008
  - **场景**：SCN-002
  - **验收**：AC-VIEW-002

- **FR-VIEW-003**：页面必须为 loading、ready、empty valid、partial、stale 和 fatal error 提供明确可读状态；partial/stale 仍显示可用事实，并始终显示 generated time、coverage 和 errors。
  - **范围边界**：恢复行为遵守“页面状态与恢复”矩阵；浏览器刷新只重读已发布数据，不能伪装修复上游错误。空列表不等于零问题证明。
  - **依据**：D-005、D-008、D-011；PFACT-004
  - **场景**：SCN-002、SCN-005、SCN-008、SCN-010
  - **验收**：AC-VIEW-003

### 真实链验收（E2E）

- **FR-E2E-001**：M15 完成前至少一个 fresh Codex 真实任务必须完整产生五阶段、step、skill、session、subagent、token、duration、retry、tool use、review、verify、automation 和 human facts，并串通 canonical facts、supporting evidence、project projection、global JSONL、data.js 与 HTML。
  - **范围边界**：fixture、schema 测试、旧日志或历史 task 不能替代；完整 skills inventory 不在本验收链。
  - **依据**：D-003、D-009、D-013；PFACT-009
  - **场景**：SCN-012
  - **验收**：AC-E2E-001

## 6. 模块划分

### 来源登记与事实采集

- **负责什么**：认证当前 task/run/session 来源，抽取可验证事实，诚实记录缺失与冲突。
- **对外提供什么**：canonical facts 与 supporting source evidence。
- **依赖谁**：launcher identity、Codex transcript、task/material/quality authority。
- **测试边界**：来源绑定、版本兼容、去重、fatal/partial 和隐私状态可独立验收。

### 退化与成本派生

- **负责什么**：对照 expected topology，派生 failure domain、成本、自动化和趋势事实。
- **对外提供什么**：不含修法和质量分的确定性诊断记录。
- **依赖谁**：canonical facts、M14a taxonomy、字段归属合同。
- **测试边界**：每个 domain、grain、冲突和样本不足状态可独立验收。

### 监控投影发布

- **负责什么**：把 task facts 变成 project 与全局可重建快照。
- **对外提供什么**：project per-task projection、derived flat JSONL、data.js。
- **依赖谁**：认证 task identity、原子发布与锁语义。
- **测试边界**：并发、半写、陈旧、重建和失败不回滚可独立验收。

### 静态监控视图

- **负责什么**：一次读取 data.js，提供默认任务总览、共享筛选、四区下钻、状态恢复说明和证据回链。
- **对外提供什么**：无需服务的只读本地监控体验。
- **依赖谁**：data.js 合同。
- **测试边界**：默认落点、共享筛选、下钻、手动浏览器刷新和状态恢复可独立验收。

## 7. 关键实体

- **Registered Source Binding**：
  - **定义**：launcher 为一次 invocation 明确授权的来源身份。
  - **字段和约束**：公开 source ref；私域 realpath/read capability；format/schema/CLI/adapter version；task/run/session binding；required 与登记身份。
  - **关系**：一个 binding 只归属一个 task/run/session；冲突为 fatal。

- **Runtime Fact**：
  - **定义**：`facts.jsonl` 中一条可机械验证的运行事实。
  - **字段和约束**：schema、fact type、status、grain、source、aggregation identity、coverage、typed value 或 reason/error、evidence refs。
  - **关系**：可引用 supporting evidence；可被多个派生视图消费但只有一个 canonical owner。

- **Monitoring Source Evidence**：
  - **定义**：支撑 runtime fact 的 immutable 机器证据。
  - **字段和约束**：受控 ref/hash/source binding；不暴露 raw native path 或 transcript。
  - **关系**：只能支撑 facts，不能成为第二事实源。

- **Project Task Projection**：
  - **定义**：一个 project 内某 task 的可重建监控记录。
  - **字段和约束**：project/task binding、schema、generated time、source refs、coverage、errors、facts summary。
  - **关系**：由 task facts 派生，被全局 projector 消费。

- **Global Monitoring Snapshot**：
  - **定义**：同一批 project records 生成的 derived flat JSONL 与 data.js。
  - **字段和约束**：schema、generated time、coverage、errors、stale/partial、records。
  - **关系**：JSONL 被 data bundler 消费；data.js 被静态 HTML 消费。

- **Diagnostic Item**：
  - **定义**：由结构化事实机械派生的退化、成本或趋势条目。
  - **字段和约束**：domain/category、status、grain、value、coverage、errors、source refs；无 solution/score 字段。
  - **关系**：只存在于派生视图，可由 canonical facts 重算。

### M15 字段归属矩阵

| 字段或字段组 | producer / owner | 可信来源 | 消费视图 | 分版边界 |
|---|---|---|---|---|
| task/run/invocation identity | launcher / stage runtime | task manifest + stage context | 全部视图 | fact schema |
| stage/step/outcome | stage runtime | step manifest + stage facts | 总览、退化 | fact schema |
| skill/trigger/reason/version | stage + skill runtime | skill-deps + skill facts | 退化、成本 | schema + skill |
| session/subagent/parent | launcher + Codex adapter | registered source binding | 成本、证据 | schema + adapter |
| message/tool/token/duration/retry | Codex adapter | registered transcript | 成本、排行 | schema + collector + adapter |
| review invoked/independent/outcome | review owner | quality review records | 总览、退化、趋势 | source contract |
| verify invoked/fresh/outcome | verify owner | quality verify record | 总览、退化、趋势 | source contract |
| automation/human origin | host interaction adapter | interaction aggregate | 成本、趋势 | schema + adapter |
| status/source/coverage/errors/refs | fact collector | registered sources | 全部事实视图 | schema + collector |
| failure/friction/error aggregation | diagnostic projector | facts + M14a taxonomy | 退化、趋势 | schema + taxonomy |
| generated/stale/partial metadata | projection owner | canonical facts | project/global/page | projection schema |
| schema/collector/adapter/skill versions | respective contract owner | released contracts | 兼容与版本对比 | each separate |

矩阵随 fact schema 同步；新增字段没有 owner、可信来源、消费视图和独立版本归属时，schema 变更不得通过。

## 8. 数据和生命周期

- **数据粒度**：每条 runtime fact 明确 task/run/stage/step/skill/session/subagent 等适用 grain；project projection 一 task 一记录；global snapshot 汇总所有合法 project records。
- **数据时效**：canonical fact 在真实事件发生后追加；supporting evidence create-only；project/global 在任务写成功后重建。页面只在打开或浏览器刷新时读取。
- **缺失或迟到**：普通缺失、迟到和单条损坏生成 missing/unknown/partial；后续合法数据可在下一次投影中出现。fatal 输入不发布新快照。
- **预览与正式**：不存在用户可编辑预览；页面展示最近一次完整发布快照，并标 current/stale/partial。
- **当前与历史**：facts append-only；supporting evidence immutable；project/global 可覆盖重建但必须携带 generated time 和来源范围；版本对比来自可兼容历史 facts。
- **归属与清理**：task facts/evidence 随 task 保留；project/global 是可删除、可重建派生物。改用本地服务或数据库时可删除 projection/bundle 层，canonical facts/evidence 保留。

### 状态转换

- **来源**：unregistered → missing；registered → validating → observed/partial/fatal。
- **canonical 采集**：ready → appending → recorded/partial/failed；失败不得伪造成功 fact。
- **派生发布**：current → rebuilding → current；失败则保留旧 snapshot 并标 stale/error。
- **页面**：loading → ready/empty/partial/stale/fatal；打开后不发生后台刷新转换，浏览器刷新重新从 loading 开始。

## 9. 兼容性预留

- **既有消费方**：旧 task-fact v1 行继续可读；既有 quality owner 不变；M15 不接管完整 skills inventory。
- **命名预留**：source schema、collector implementation 和 skill version 分开，避免一次变化误写成另一种版本。
- **容器预留**：新事实按封闭 fact type 扩展，不接受 arbitrary payload；新增 CLI 通过同一 registered-source 边界接入。
- **状态预留**：missing、unknown、unsupported、partial、stale、conflict 与 fatal 保持独立，可增加受控 reason code 但不得改旧语义。
- **扩展边界**：M17 可增加 Claude/其他 CLI adapter；M16 可消费事实形成候选池；两者不能要求 M15 预建 solution 字段或多 CLI 实现。

## 10. 明确不做与默认必须成立

### 明确不做

- 不自动优化、不生成候选优先级、不输出“应该把 X 改成 Y”的改法；候选池和 attempted edits 交 M16。
- 不做 Claude 或完整多 CLI adapter、repo-contained skills 收敛；交 M17。
- 不重做或接管完整 skills inventory；仍由既定 M14b owner 补齐。
- 不提供质量评分、blocking gate、LLM 事实推断或 style 维度。
- 不启动 localhost 服务，不使用目录选择器，不让页面扫描磁盘。
- 不做页面内自动刷新、轮询、自定义刷新按钮或筛选状态持久化。
- 不迁移旧 AgentHub Next.js 前端，不复制其路径、collector 或 blocking 逻辑。
- 不新增 per-skill 机器入口，不建立第二套 canonical metrics/index/task lookup。
- 不授权 commit、push、merge、archive、cleanup 或历史数据迁移。

### 默认必须成立

- 所有外部路径与身份输入先校验，路径越界和绑定冲突 fail-loud。（FR-SOURCE-001、AC-SOURCE-001）
- unknown/missing 不能变成 0、false 或 success。（FR-DIAG-003、AC-DIAG-003）
- project/global/page 失败不能改写或回滚 canonical task facts。（FR-PROJ-002、AC-PROJ-002）
- 页面文本安全转义，来源文本不得成为脚本或 HTML。（FR-PROJ-003、AC-PROJ-003）
- 指标只观察，不作为任务是否能继续的门。（FR-DIAG-003、AC-DIAG-003）

## 11. 验收标准

### AC-001 / AC-SOURCE-001：来源登记和绑定可机械验证

- **需求**：FR-SOURCE-001
  验证：来源身份合同测试 + 越界/错 task/run/session 场景回放
- **通过条件**：合法登记可采集；猜测来源不可进入；非法 realpath、binding、重复身份或隐私越界明确失败
- **失败条件**：扫描 session 目录、按 cwd/时间猜测、公开 raw path，或错 session 被归入 task
- **证据类型**：`test`

### AC-002 / AC-SOURCE-002：Codex 来源的普通缺失与单条损坏可诚实降级

- **需求**：FR-SOURCE-002
  验证：支持版本、未登记、not found、unsupported、read error、malformed line、duplicate conflict 场景回放
- **通过条件**：fatal/partial/missing/unknown 与 coverage/error 符合合同，合法行继续可用
- **失败条件**：任何错误被静默跳过、写 0、写成功，或单坏行无条件毁掉全部合法数据
- **证据类型**：`test`

### AC-003 / AC-FACT-001：唯一 facts 权威能表达全部 M15 fact type 且旧 v1 可读

- **需求**：FR-FACT-001
  验证：合同兼容测试 + 每类 typed fact 正反例
- **通过条件**：D-013 所有类别可严格验证；present 与 missing/unknown 字段互斥；index 只存 ref/hash/version
- **失败条件**：另建 canonical index、任意 payload 通过、旧 v1 失读，或事实语义复制进 task index
- **证据类型**：`test`

### AC-004 / AC-FACT-002：taxonomy、字段归属和版本边界可追溯

- **需求**：FR-FACT-002
  验证：合同与归属矩阵审查
- **通过条件**：归属矩阵覆盖每个新增字段；taxonomy 恰为 `task_dir/worktree/review/verify/handoff/transcript/skill_missing/artifact_missing/token_waste`；schema/collector/adapter/skill version 分离
- **失败条件**：实现常量成为未声明新权威、历史 archive 被覆盖，或字段无 owner/consumer
- **证据类型**：`evidence`

### AC-005 / AC-FACT-003：quality facts 保持原 owner，M15 只发布观测事实

- **需求**：FR-FACT-003
  验证：review/test/verify present、unavailable、stale 场景回放
- **通过条件**：invoked/independent/outcome/freshness/ref/coverage 可见，原始 quality record 未复制或改写
- **失败条件**：provider failure 被记为无问题，或 M15 创建第二 review/verify 权威
- **证据类型**：`test`

### AC-006 / AC-FACT-004：grain、聚合身份和多来源冲突不丢失

- **需求**：FR-FACT-004
  验证：同 source、跨 source、缺 skill/version、同 grain 冲突场景回放
- **通过条件**：`source+skill_id+version` 与 grain 可见；冲突来源分别保留并标 conflict
- **失败条件**：静默换主键、相加冲突 token，或为采集新增 per-skill 入口
- **证据类型**：`test`

### AC-007 / AC-DIAG-001：stage、step、skill 三层对照不混淆

- **需求**：FR-DIAG-001
  验证：pending future stage、stage 断链、step skipped/not-applicable/missing/out-of-order、skill trigger true/false 场景回放
- **通过条件**：每种情况得到唯一正确状态，trigger=false 有 reason 时不误报
- **失败条件**：把 future stage 或合法 skip 报成退化，或漏报 required skill
- **证据类型**：`test`

### AC-008 / AC-DIAG-002：failure domain 只由受控事实派生

- **需求**：FR-DIAG-002
  验证：分别构造九个 taxonomy domain 的正反例；taskPath 缺口核对 `task_dir` 映射
- **通过条件**：每个缺口产生唯一受控 domain 和来源 ref，不含 score/root cause/solution
- **失败条件**：LLM 或自由文本决定 domain，或输出修复建议
- **证据类型**：`test`

### AC-009 / AC-DIAG-003：状态和 coverage 诚实展示

- **需求**：FR-DIAG-003
  验证：十类数据状态的结果检查
- **通过条件**：每个状态互不替代，partial/stale 保留可用事实和 errors
- **失败条件**：missing/unknown 被渲染为 0/false，empty valid 被称为零问题，指标成为 gate
- **证据类型**：`test`

### AC-010 / AC-COST-001：成本事实按正确 ID 去重与归并

- **需求**：FR-COST-001
  验证：重复 message、同 message 多 tool use、明确 retry、缺 parent/duration 场景回放
- **通过条件**：token/tool/retry/duration 与声明 grain 一致，未知层级或耗时保持 unknown
- **失败条件**：tool use 被 message 去重丢失、mtime 被当 duration，或相似动作被猜为 retry
- **证据类型**：`test`

### AC-011 / AC-COST-002：高成本与机械可证浪费分开

- **需求**：FR-COST-002
  验证：高成本不重复、重复 ID、已登记冗余三类对照
- **通过条件**：仅后两类满足合同时出现 token waste；高成本只参加排行
- **失败条件**：固定阈值、均值或模型判断产生 waste
- **证据类型**：`test`

### AC-012 / AC-COST-003：问题聚合、自动化率、人工介入和趋势有合法分母

- **需求**：FR-COST-003
  验证：origin 完整/缺失、单桶/双桶、review/verify、三个问题键和 count 1/2 场景回放
- **通过条件**：分母缺失为 unknown；review_invoked/verify_fresh/自动化/人工只在双兼容桶显示趋势；问题只按三个受控键聚合且 count 至少 2 才称常见
- **失败条件**：缺 origin 的动作被默认归人或自动、单桶被画成趋势、问题按自由文本聚合，或 review/verify 趋势被漏掉
- **证据类型**：`test`

### AC-013 / AC-PROJ-001：project projection 身份正确且可重建

- **需求**：FR-PROJ-001
  验证：多 project/task、错 binding、删除后重建场景
- **通过条件**：每 task 独占记录；错身份拒收；删除派生物后从 facts 重建一致结果
- **失败条件**：projection 被 runtime 用来找 task，或不同 task 互相覆盖
- **证据类型**：`test`

### AC-014 / AC-PROJ-002：并发全局发布不丢数据、不半写

- **需求**：FR-PROJ-002
  验证：至少两个 task 并发更新、project/root 发布失败回放
- **通过条件**：消费者只读到完整旧/新快照；canonical facts 不回滚；失败留下 stale/error
- **失败条件**：共享数组增量覆盖、半个 JSONL/data.js 可见，或 projection failure 使 task 失败
- **证据类型**：`test`

### AC-015 / AC-PROJ-003：无服务 data.js 可安全读取

- **需求**：FR-PROJ-003
  验证：隔离浏览器打开本地页面，输入含引号、标签、脚本样式文本和错误状态
- **通过条件**：页面成功读取固定赋值；文本只显示不执行；schema/time/coverage/errors 可见
- **失败条件**：依赖 file fetch/目录授权/服务，或来源文本造成脚本/HTML 注入
- **证据类型**：`test`

### AC-016 / AC-VIEW-001：单页四区和筛选范围完整

- **需求**：FR-VIEW-001
  验证：页面场景验收
- **通过条件**：默认进入所有 project 最近快照的任务总览；四区、七类共享筛选、task 下钻、三类事实维度和受控证据回链可用；兼容版本可比较，不兼容范围显示 mismatch/insufficient_samples；切区保留筛选，浏览器刷新回默认；无编辑/修复/评分入口
- **失败条件**：默认落点不确定、各区筛选互相漂移、下钻丢 task 范围、缺任一区、不可比版本被合并、出现自动改法/质量分，或增加任务管理页面
- **证据类型**：`manual`

### AC-017 / AC-VIEW-002：页面严格采用打开时读取、浏览器手动刷新

- **需求**：FR-VIEW-002
  验证：页面打开后更新 data.js，再观察刷新前后
- **通过条件**：刷新前保持旧快照；浏览器刷新后显示新快照；没有轮询、自动 reload 或自定义刷新按钮
- **失败条件**：页面后台自行变化，或用户必须运行生成命令才能读取已发布数据
- **证据类型**：`test`

### AC-018 / AC-VIEW-003：页面状态不会隐藏缺口

- **需求**：FR-VIEW-003
  验证：loading、empty、partial、stale、fatal 页面状态验收
- **通过条件**：每态按恢复矩阵显示可用内容、恢复条件和 generated time；empty 可清除筛选；partial/stale 保留已知事实；fatal 不显示伪完整结果且错误摘要位于结果焦点
- **失败条件**：错误只在控制台、所有错误都笼统建议刷新、stale 无时间、fatal 仍显示旧数字，或空态被当健康证明
- **证据类型**：`manual`

### AC-019 / AC-E2E-001：fresh Codex 真实任务完成全链

- **需求**：FR-E2E-001
  验证：真实任务业务验收 + source/fact/projection/page 证据追踪
- **通过条件**：所有事实类别从真实事件进入页面并可回指；故意缺失/损坏/fatal 场景符合状态合同
- **失败条件**：任一关键类别只由 fixture 证明、页面读旧假数据，或无法回指 canonical fact/source
- **证据类型**：`evidence`

## 12. 风险、未决与交接

- **RISK-01**：Codex transcript 形状漂移
  - **受影响 ID**：PFACT-007、FR-SOURCE-002、AC-SOURCE-002
  - **触发条件**：CLI/schema version 超出 adapter 支持范围
  - **后果**：成本或 session 事实变为 unknown/partial
  - **缓解或 STOP**：显式 support matrix；未知版本禁止猜读，保持 unsupported
  - **处理 Stage**：`build-plan`
  - **验证**：支持与不支持版本场景都有可判结果

- **RISK-02**：M15 吞并全部 M14b/M17
  - **受影响 ID**：FR-FACT-001、FR-E2E-001
  - **触发条件**：开始补完整 skills inventory、Claude adapter 或通用 trace 平台
  - **后果**：范围失控且停止条件消失
  - **缓解或 STOP**：只修页面真实消费链；触发即停止并回到 decision-log
  - **处理 Stage**：`build-plan`
  - **验证**：计划范围逐项映射本 spec，延期项无实现任务

- **RISK-03**：派生快照陈旧被误认成当前
  - **受影响 ID**：FR-PROJ-002、FR-VIEW-003、AC-PROJ-002、AC-VIEW-003
  - **触发条件**：project/root 发布失败或页面长期开启
  - **后果**：用户看到旧事实
  - **缓解或 STOP**：始终显示 generated time/stale/error；页面更新依赖浏览器手动刷新
  - **处理 Stage**：`build-code`
  - **验证**：SCN-010 与 AC-VIEW-002/003

- **RISK-04**：多来源 token 重复或冲突
  - **受影响 ID**：FR-FACT-004、FR-COST-001、AC-FACT-004、AC-COST-001
  - **触发条件**：同 grain 同时出现 transcript 与旧 metering 值
  - **后果**：成本排行失真
  - **缓解或 STOP**：当前 Codex transcript 为宿主 token 权威；其他来源分别显示 conflict，不求和
  - **处理 Stage**：`build-code`
  - **验证**：多来源冲突回放

- **RISK-05**：本地数据包含可执行或私有内容
  - **受影响 ID**：FR-SOURCE-001、FR-PROJ-003
  - **触发条件**：来源字符串含脚本/HTML，或 projection 暴露 raw path/transcript
  - **后果**：本地代码执行或隐私泄露
  - **缓解或 STOP**：安全 JSON 序列化、文本渲染、opaque refs；发现泄露即停止发布
  - **处理 Stage**：`build-code`
  - **验证**：AC-SOURCE-001、AC-PROJ-003

- **RISK-06**：Git 历史对象库缺失
  - **受影响 ID**：FR-E2E-001、AC-E2E-001
  - **触发条件**：正式 snapshot/close 读取缺失 ancestor
  - **后果**：实现可测试但无法做正式完成或 close 声明
  - **缓解或 STOP**：完成前由 repo maintenance 恢复并读回对象；未恢复则保持 incomplete
  - **处理 Stage**：`build-plan`
  - **验证**：snapshot/close 所需对象可读取

- **RISK-07**：M14b skills inventory 仍未兑现
  - **受影响 ID**：PFACT-009、FR-E2E-001
  - **触发条件**：M17a 准备消费 inventory
  - **后果**：M17a 缺既定前置
  - **缓解或 STOP**：M15 不接管；由 M14b owner 在 M17a 前补齐
  - **处理 Stage**：`build-plan`
  - **验证**：M15 计划无 inventory 实现，handoff 保留 owner 与关闭条件

### Deferred/open handoff closure inherited from make-decision

这些条目在 make-decision 已关闭，不是新的产品需求；下游仍保留 owner、触发、消费者和关闭/保留条件，避免“已解决”在交接时丢失。

| id | status | owner | trigger | handoff / consumer | close / retain condition |
|---|---|---|---|---|---|
| OPEN-001 | closed | make-decision | D-005/D-007/D-008/D-011 | build-spec consumes flow/state contract | retain decision and spec flow/state |
| OPEN-002 | closed | make-decision | D-002 | build-spec consumes fixed five-stage rule | retain stage/step/skill contract |
| OPEN-003 | closed | make-decision | D-006/D-011 | build-spec consumes metric denominator rules | retain formulas and insufficient-samples rule |
| OPEN-004 | closed | make-decision | F-003 input audit | build-plan/build-code consume unavailable-input fact | retain incomplete input evidence |
| OPEN-005 | closed | make-decision | D-003 user scope choice | build-plan consumes same-task repair boundary | retain no successor and no scope expansion |
| OPEN-006 | closed | make-decision | D-004 user source choice | build-code consumes Codex-only adapter boundary | retain Claude/multi-CLI deferral to M17 |
| OPEN-007 | closed | make-decision | D-005 failure contract | build-code consumes fatal/partial semantics | retain fail-loud and partial rules |
| OPEN-008 | closed | make-decision | D-006 waste rule | build-code consumes mechanical-only waste | retain no quality score or inferred waste |
| OPEN-009 | closed | make-decision | D-007 static-page choice | build-code consumes fixed HTML/manual refresh | retain no server/auto polling |
| OPEN-010 | closed | make-decision | D-008/D-012 authority choice | build-code consumes facts→projection→data.js chain | retain derived-only global outputs |
| OPEN-011 | closed | make-decision | D-009 E2E requirement | verify-code consumes fresh-host evidence | retain unknown/incomplete until binding exists |
| OPEN-012 | closed | make-decision | D-010 source registration | build-code consumes launcher opaque binding | retain no native-session scan |
| OPEN-013 | closed | make-decision | D-012 single authority | build-code/verify-code consume facts.jsonl authority | retain supporting evidence only |

- **OPEN-01**：无产品方向或规格歧义。
  - **受影响 ID**：全部
  - **owner**：build-spec
  - **影响**：无；精确工程文件、代码符号和测试命令属于 build-plan，不是 spec 缺口
  - **处理 Stage**：`build-spec`
  - **关闭条件或 STOP**：已由 spec-clarify 回复 C 关闭唯一页面刷新歧义

## 13. 业务影响与回归范围

### WorkflowHub task 执行

- **既有行为**：task facts、材料和 quality facts 分别记录，但没有 M15 可用的完整消费链。
- **本需求影响**：受支持的真实任务新增可验证运行事实和 supporting evidence；采集/投影不成为任务 gate。
- **回归路径**：五阶段正常执行、review unavailable、verify stale、taskPath/worktree mismatch、普通来源缺失、fatal identity error。
- **验收**：AC-SOURCE-001～002、AC-FACT-001～004、AC-DIAG-001～003

### 本地监控体验

- **既有行为**：没有可用的跨 project 静态事实监控页。
- **本需求影响**：用户可打开固定 HTML 查看最近发布快照；任务更新后手动刷新浏览器页面。
- **回归路径**：ready、empty、partial、stale、fatal、手动刷新、注入字符串。
- **验收**：AC-PROJ-001～003、AC-VIEW-001～003

### 成本与趋势解释

- **既有行为**：旧 metering 来源分散且粒度不一致。
- **本需求影响**：成本按明确 grain/source 排行，冲突与样本不足可见，高成本不自动判浪费。
- **回归路径**：重复 message/tool、跨来源冲突、缺 origin、单桶、版本不兼容。
- **验收**：AC-COST-001～003

- **可能受冲击的业务规则**：五阶段固定、quality facts 不变成 gate、事实缺失不补值、task identity 不靠扫描推断。
- **明确无影响**：M16 候选池、M17 多 CLI、完整 skills inventory、任务管理和旧 AgentHub 前端。

## Spec Clarification Record

- **axis**：静态页面打开后的数据刷新触发方式
- **classification**：new ambiguity
- **source**：build-spec spec-clarify；用户真实回复
- **answer**：`C，手动刷新页面也可以`
- **affected**：SCN-002、PFACT-008、FR-VIEW-002、AC-VIEW-002、RISK-03
- **consequence**：页面只在打开/浏览器刷新时读一次，不增加轮询或页面内刷新入口
- **risk**：长时间打开会显示旧快照，因此 generated time/stale 状态必须可见
- **superseded wording**：任何“页面自动刷新/实时更新”的未确认推断

## Spec Research Record

- **SRES-001**：executed；当前 task-fact/quality/index 合同不足以承载 D-013，采用旧 v1 可读 + 新 discriminated fact contract，不复活并列 runtime indexes。
- **SRES-002**：executed；显式继承 M14a taxonomy/字段归属/独立版本语义，不把 archive 或实现常量伪装成当前 active authority。
- **SRES-003**：executed；当前 registered source contract 无法证明 task/run/session/realpath 绑定，spec 补齐最小可验证边界与 fatal/partial 状态。
- **SRES-004**：executed；复用 task facts、quality owner、expected topology 与原子写职责；M15 只修自身消费链，完整 skills inventory 保持 M14b owner。

## 下游交接

- build-plan 必须把每个 FR/AC 映射到 verified owner、生产者、消费者、测试层与真实 E2E 证据，不得重新决定页面刷新、事实权威或来源优先级。
- build-plan 必须先证明复用 task facts/quality/manifest/atomic publication 的范围，再为缺口选择最小新增。
- exact code paths、symbols、commands、phase 划分和任务顺序只写入 plan/tasks，不回填本 spec。
