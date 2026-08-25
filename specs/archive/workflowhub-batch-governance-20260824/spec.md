# 功能规格：WorkflowHub 正常执行优先治理

> 基于已确认的 make-decision 方向。本文件只定义 WorkflowHub 的产品行为、可观察边界和验收，不定义代码文件、工程命令或任务拆分。

- **功能名**：WorkflowHub 正常执行优先治理
- **来源**：R-001～R-008、D-001～D-008、D-007 的 F11 方向、当前用户确认进入 build-spec
- **状态**：已生成；本阶段质量事实仍有 `unavailable`、`unknown` 和历史测试失败，不能称为绿色或 release-ready
- **内容配置**：`spec-content.v3`

## 速读卡（30 秒）

- **一句话需求**：让合法的普通 WorkflowHub 任务直接使用当前 trusted worktree 顺畅执行，同时只保留真正保护写入、完整性和正式发布的控制。
- **核心改动点**：
  - 把 workspace、核心材料、质量事实、完成判定和 review 责任收敛到已有 owner。
  - 把 provider、历史记录、catalog 漂移和辅助证据缺失从普通执行硬阻塞降为真实的 `unavailable`、`unknown` 或 `incomplete`。
  - 删除没有真实消费者的旧表面，保留真实消费者需要的最小只读兼容。
- **最大影响面**：任务 bootstrap、stage runner、质量/完成状态、review provenance、旧 reader、catalog/bundle 维护和阶段交接。
- **验收信号**：现有 trusted worktree 不再被强制要求第二 workspace；错误写入仍明确失败；用户能看到完整决策和真实未完成事实。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | 状态 / 影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001 | D-001 | FR-EXEC-001、FR-BOUNDARY-001、AC-001、AC-004 | current；trusted worktree 和原始 checkout 边界 | 具体绑定接口留 build-plan |
| R-002、R-003 | D-002、D-007 | FR-GOV-001、FR-REPORT-001、AC-002、AC-011 | current；整批治理，不再接受零散补丁 | 后续只按本规格实施 |
| R-004 | D-004、D-005、D-006、D-007 | FR-CONTROL-001、FR-REVIEW-001、AC-003、AC-006 | current；不新增 public 控制面 | 发现新增控制需求必须退回 make-decision |
| R-005 | F-003、F-004、F-005、G-002 | FR-EXEC-002、FR-TRUTH-001、FR-CATALOG-001、AC-005、AC-008、AC-009 | current；覆盖运行时、质量、review、目录和兼容 | 逐项 consumer 对账留 build-plan |
| R-006 | D-003、D-004、D-005、D-006 | FR-CONTROL-001、FR-COMPAT-001、FR-REVIEW-001、AC-003、AC-006、AC-007 | current；每个保留表面必须有 owner、consumer、oracle、失败语义 | 缺任一项就不保留为 live 控制 |
| R-007 | D-007、FND-005、FND-006 | FR-TRUTH-001、FR-HANDOFF-001、AC-005、AC-010 | current；不把绿色、空 findings 或 transport success 当验收 | 真实 unavailable 继续交接 |
| R-008 | D-008、F-002、F-007 | FR-TRUTH-002、FR-BRANCH-001、AC-011、AC-012 | current；失败、未归属 diff 和分支风险必须保留 | 失败分层和 diff 归属留 build-plan |
| FND-007～FND-013 | D-007 | FR-EXEC-001、FR-EXEC-002、FR-CONTROL-001、AC-001、AC-003 | current；采用最小执行优先修正 | 不新增 wrapper、gate、计数器或第二 owner |
| 当前用户反馈 | 可见性失败记录 | FR-HANDOFF-001、AC-010 | current；决策不能只写在 worktree | 具体 host/UI 根因仍 unknown |

## 1. 问题与紧迫性

WorkflowHub 最近两轮改动把一个简单的任务执行框架扩展成了许多互相牵制的内部控制面：运行时身份、质量事实、review provenance、snapshot/freshness、bundle/catalog、stage runner、bridge、task handle 和大量测试都可能影响任务是否能继续。

实际结果是，合法的 trusted worktree 也可能因为确定性任务路径不匹配而被挡住；review provider、历史记录、catalog 或辅助证据不可用时，普通任务容易被误认为不能执行。维护者还难以判断某个对象到底有没有真实消费者，导致旧表面不敢删、新表面继续增加。

本批要解决的不是再加一层检查，而是一次性把这些表面按真实用途收敛：正常执行优先，质量事实真实保留，真正的写入和发布风险继续 fail-loud。

## 2. 背景、目标与范围

### 背景

上游已新增宪法 F11“正常执行优先、控制面受限”。F11 保持原有高质量和不假绿要求，但明确普通任务不应被没有真实消费关系的辅助事实拖住。已有五阶段、已有质量事实 owner、已有完成/发布判定、已有 review 记录和已有兼容读取能力优先复用。

### 目标

- 合法的现有 trusted worktree 可以直接进入普通执行路径，不需要第二 workspace 或强制确定性路径。
- workspace、核心材料、质量事实、canonical review、完成判定和正式发布各有一个真实 owner。
- provider、历史、catalog、bundle 或辅助证据缺失时，状态真实可见但不单独冻结普通任务。
- 错误写入、错误身份、hash 冲突、破坏性操作和正式发布结构错误仍然明确失败。
- 维护者能依据真实 consumer、完成 oracle、失败语义和回滚条件删除或合并旧表面。

### 范围内

- task bootstrap 与当前 trusted worktree 的绑定行为。
- 四件核心材料的唯一产品语义和旧路径的只读兼容边界。
- quality fact、material revision、snapshot/freshness、completion/release 的状态语义。
- `dsh-code-review` 的 canonical `code_review` 与 `wh-review` 的 advisory/provenance 分工。
- catalog、bundle closure、stage dependency 与真实 consumer 的投影关系。
- 旧记录、legacy reader、旧 projection 的保留、归档和删除条件。
- 阶段交接中用户可见的决策、风险、未完成和不可用事实。
- 分支/worktree 的保留边界和一次性交付对比报告。

## 3. 用户场景与状态覆盖

### SCN-001：使用现有 trusted worktree 正常开始任务

- **角色**：任务维护者
- **Given**：当前 task 已绑定一个合法 trusted worktree，核心材料可读，路径和分支已经由用户明确指定。
- **When**：启动或继续普通 stage。
- **Then**：WorkflowHub 直接消费这个 worktree；确定性路径只作为新建任务的默认值，不要求用户再创建第二个 workspace；任务可以继续到既有 stage。

### SCN-002：辅助事实缺失但普通工作仍可继续

- **角色**：任务维护者
- **Given**：review provider、历史记录、catalog closure、stage ready 或辅助证据不可用，但当前 workspace、核心材料和写边界有效。
- **When**：继续普通任务。
- **Then**：任务继续；用户看到对应的 `unavailable`、`unknown`、`incomplete` 或 stale 原因；系统不把它改成 pass，也不把它单独升级为普通执行阻塞。

### SCN-003：错误 workspace 或错误写入被及时拒绝

- **角色**：WorkflowHub 运行边界
- **Given**：workspace、task、stage、材料 revision、snapshot 或写入目标不匹配，或出现 hash 冲突、破坏性操作、正式发布结构错误。
- **When**：准备写当前事实、完成记录或正式发布。
- **Then**：操作明确失败，不覆盖当前事实，不伪造完成，不把失败降级成 advisory；用户得到可定位的失败原因。

### SCN-004：质量状态不冒充完成或 release

- **角色**：任务维护者和交付接收者
- **Given**：质量摘要可能是 `passed`，但阶段仍 `in_progress`，或存在 stale、缺失、serious finding、未完成或未发布事实。
- **When**：查看状态、close 或 release 结果。
- **Then**：仍由已有 completion/release 判定决定完成语义；质量摘要不能单独放行；未完成和未发布事实保持可见。

### SCN-005：canonical review 与异源 advisory 分工

- **角色**：verify-code 使用者
- **Given**：执行审查和异源建议都存在，或异源 provider 不可用。
- **When**：生成 completion、close 或交接状态。
- **Then**：只有 `dsh-code-review` 的唯一 canonical `code_review` ref/hash 参与完成；`wh-review` 作为已有 advisory subject 保存建议和 provenance；不可用仍记录为 unavailable。

### SCN-006：旧记录按真实消费者兼容或删除

- **角色**：维护者和历史 reader
- **Given**：某旧 record、旧 projection 或 legacy reader 被发现。
- **When**：判断是否继续保留。
- **Then**：有真实 consumer 时保留最小只读兼容，不能写当前事实；没有代码、manifest、运行时或交付证据证明 consumer 时，进入可恢复归档和删除候选；不得因为未知可能性永久冻结 live 控制面。

### SCN-007：catalog 或 bundle closure 漂移

- **角色**：技能维护者
- **Given**：catalog、manifest、stage dependency、bundle closure 或真实 host/CLI consumer 不一致。
- **When**：执行能力关系核对。
- **Then**：漂移作为诊断事实修正或删除投影，不成为普通任务的新增 public gate；closure 通过也不被解释为产品验收或 release。

### SCN-008：snapshot、material revision 或 freshness 失配

- **角色**：质量事实消费者
- **Given**：结果来自旧材料、旧 snapshot、不同 bytes 或已过期事实。
- **When**：尝试把结果用于当前任务完成或发布。
- **Then**：结果保持 stale、unknown 或 incomplete，不能覆盖当前事实；同 bytes 的合法 replay 沿用既有幂等语义，冲突 replay 明确失败。

### SCN-009：阶段交接对用户可见

- **角色**：任务用户
- **Given**：决策或规格材料已经写入 worktree，但正式 aggregate/stage publication 不可用。
- **When**：系统请求用户确认或交接下一阶段。
- **Then**：聊天或宿主可见沟通中直接呈现目标、范围、非目标、成功标准、风险、审查事实、未决和延期；文件存在、绿色测试或 stage ready 不能代替这份可见沟通。

### SCN-010：基线测试失败如实分层

- **角色**：任务维护者
- **Given**：全量测试基线有失败，定向测试或 closure smoke 可能通过。
- **When**：生成治理交接或判断质量。
- **Then**：保留全量失败及其口径，按本批相关、基线外部噪音、环境/契约漂移和未执行事实分层；定向通过不扩大为绿色、验收或 release。

### SCN-011：分支和 worktree 的保留与清理分开

- **角色**：仓库维护者
- **Given**：健康基线、活动治理 worktree、只读恢复 worktree 和损坏原始 checkout 同时存在。
- **When**：结束本批或提出清理。
- **Then**：健康基线和活动 worktree 保留；恢复 worktree 先做可回指归档；原始 checkout 继续只读隔离；archive、cleanup、branch 删除必须另行授权。

### 状态覆盖清单

- [x] **默认态**：SCN-001；合法 workspace 与核心材料可读，普通任务继续。
- [x] **空态**：SCN-006、SCN-007；无 consumer 的旧表面或目录声明进入删除候选，不产生空兼容层。
- [x] **错误态**：SCN-003、SCN-008；身份、写入、hash、snapshot 或发布结构错误明确失败。
- [x] **加载态**：SCN-002、SCN-004；质量事实仍计算或缺失时显示既有 incomplete/unknown，不显示完成。
- [x] **取消态**：SCN-005；review 取消沿用既有 unavailable/取消事实，不新增取消状态机。
- [x] **边界态**：SCN-004、SCN-006、SCN-007、SCN-008；质量、兼容、目录和 freshness 边界分别处理。
- [x] **权限态**：SCN-003、SCN-011；原始 checkout、commit、push、merge、archive、cleanup 不由本规格顺带授权。
- [x] **竞态**：SCN-008；同 bytes replay 沿用既有幂等，冲突 replay、不同结果和 stale 结果不覆盖当前事实。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：本批使用的 trusted clone 基线健康，原始 checkout 必须只读。
  - **status**：`verified`
  - **证据或来源**：F-001、D-001；trusted clone 基线和原始 checkout 隔离事实已完成只读核对。
  - **关联**：FR-EXEC-001、FR-BOUNDARY-001、FR-BRANCH-001、AC-001、AC-012

- **PFACT-002**：确定性 task workspace 与用户指定的现有 trusted worktree 不一致，曾导致 review runner `unavailable/ENOENT`。
  - **status**：`verified`
  - **证据或来源**：FND-005、FND-006、G-002；不可用事实不能改写为 pass。
  - **关联**：FR-EXEC-001、FR-TRUTH-001、AC-001、AC-005

- **PFACT-003**：当前质量、完成和发布语义已经存在，但质量摘要、stage completion 和 product release 可能同时显示不同状态。
  - **status**：`verified`
  - **证据或来源**：F-004、F-006、FND-004、G-001。
  - **关联**：FR-TRUTH-001、FR-CONTROL-001、AC-004、AC-005

- **PFACT-004**：全量测试基线不是绿色；历史材料曾记录 34 个失败测试和 14 个失败文件，当前 snapshot 的精确数量必须由 build-code/T050 重新运行后记录，不能沿用历史数字。
  - **status**：`verified_historical_count; current_count_pending`
  - **证据或来源**：F-002、FND-001；历史定向测试通过不改变全量基线事实，当前数量不在本规格中预先断言。
  - **关联**：FR-TRUTH-002、FR-HANDOFF-001、AC-010、AC-011

- **PFACT-005**：verify-code 当前存在两条同名 `code_review` 生产链，用户已确认只保留一个 canonical completion owner。
  - **status**：`verified`
  - **证据或来源**：F-004、D-006、FND-003。
  - **关联**：FR-REVIEW-001、FR-CONTROL-001、AC-003、AC-006

- **PFACT-006**：本阶段此前的 `wh-review` direction/detail advice 因 workspace 路由问题均为 `unavailable/ENOENT`，没有有效的空 findings 或 pass 事实。
  - **status**：`verified`
  - **证据或来源**：FND-005、FND-006。
  - **关联**：FR-TRUTH-001、FR-HANDOFF-001、AC-005、AC-010

- **PFACT-007**：bundle closure 和定向 smoke 有通过事实，但 catalog、manifest、stage dependency 与真实 consumer 仍有漂移和幽灵声明。
  - **status**：`verified`
  - **证据或来源**：F-003、F-005、G-001。
  - **关联**：FR-CATALOG-001、AC-008

- **PFACT-008**：部分旧 projection、旧 record 和 legacy reader 仍可能被真实消费者读取，但逐项 consumer 清单尚未闭合。
  - **status**：`unknown`
  - **owner、影响**：后续 build-plan owner；误删会破坏历史读取，永久保留又会维持无效维护面；关联 RISK-SPEC-003、OPEN-SPEC-003。
  - **关联**：FR-COMPAT-001、AC-007

- **PFACT-009**：历史 snapshot 有 17 个已跟踪代码/测试文件修改；后续盘点观察到 25 个 tracked diff，当前数量、来源、owner 和是否属于本批仍须以 T000 的 current snapshot 为准。
  - **status**：`historical_17; current_25_observed_pending_provenance`
  - **owner、影响**：T000 owner；误纳入会造成范围和验收归因错误，误回退会损失用户工作；17-file 只作历史口径，不能覆盖当前盘点。
  - **关联**：FR-GOV-001、FR-TRUTH-002、AC-001、AC-011

- **PFACT-010**：用户已经明确反馈无法看到完整决策和沟通，因此只把材料写入 worktree 不足以完成确认交接。
  - **status**：`verified`
  - **证据或来源**：用户当前反馈、decision-log 的“可见性失败”记录。
  - **关联**：FR-HANDOFF-001、AC-010

- **PFACT-011**：健康基线、活动治理 worktree、只读恢复 worktree 和损坏原始 checkout 的处置边界已经确认，但恢复 worktree 的归档尚未独立完成。
  - **status**：`verified`
  - **证据或来源**：D-008、分支/worktree 盘点材料。
  - **关联**：FR-BRANCH-001、AC-012

## 5. 功能需求

### 一次性治理范围（GOV）

- **FR-GOV-001**：本批必须用一套完整的保留、合并、删除和延期边界治理既有内部表面；不能把事实缺口拆成新的零散 gate、对象或阶段。
  - **范围边界**：包含本批点名的 runtime、quality、review、freshness、catalog、bundle、runner、bridge、task handle、兼容和测试维护面；不改变 PaperBuilder 或其他产品方向。
  - **依据**：R-002、R-003、R-004、D-002、D-007、PFACT-009
  - **场景**：SCN-001、SCN-006、SCN-007、SCN-011
  - **验收**：AC-002、AC-003、AC-011

### 普通执行与材料边界（EXEC）

WorkflowHub 的普通任务路径必须先确认当前合法 workspace，再消费已有核心材料和既有 stage。辅助事实的缺失不能偷偷改变任务身份，也不能被包装成新准入系统。

- **FR-EXEC-001**：当用户已经提供合法的现有 trusted worktree 时，WorkflowHub 必须直接绑定并消费该 workspace；确定性路径只能作为创建新 workspace 的默认值。
  - **范围边界**：包含正常启动和继续任务；不包含新建第二 workspace、强制固定分支名或为 review provider 绕路。
  - **依据**：D-007、FND-007、PFACT-001、PFACT-002
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-001

- **FR-EXEC-002**：核心材料必须有一套明确的当前读取语义；旧路径只能作为已有真实 reader 需要的只读兼容，不能根据“哪个文件存在”临时猜测当前事实。
  - **范围边界**：包含材料身份、revision、snapshot 和 freshness 的产品语义；不新增第五材料或第二材料真相。
  - **依据**：D-003、D-005、FND-008、FND-013
  - **场景**：SCN-001、SCN-006、SCN-008
  - **验收**：AC-002、AC-007、AC-009

### 控制、质量与完成语义（CONTROL）

- **FR-CONTROL-001**：WorkflowHub 必须复用既有 stage、canonical quality fact writer、completion oracle 和 release oracle；本批不得新增 public gate、public stage、第二状态机、第二 writer 或第二 evidence store。
  - **范围边界**：包含内部控制表面的合并、收窄和删除；不把 F11 做成运行时 gate。
  - **依据**：D-004、D-005、D-006、D-007、FND-010、FND-011、FND-012
  - **场景**：SCN-004、SCN-007
  - **验收**：AC-003、AC-004

- **FR-TRUTH-001**：review、测试、snapshot、material revision、freshness、serious finding、阶段完成和发布事实必须分别表达；`unavailable`、`unknown`、`incomplete`、stale 和未发布不得被摘要改写成 pass。
  - **范围边界**：包含状态披露和失败交接；不把一般质量缺失升级为普通执行硬阻塞。
  - **依据**：D-007、FND-004、FND-005、FND-006、PFACT-003、PFACT-006
  - **场景**：SCN-002、SCN-003、SCN-004、SCN-008、SCN-010
  - **验收**：AC-004、AC-005、AC-009、AC-010

- **FR-TRUTH-002**：测试结果必须保留全量基线、治理相关结果、环境/契约漂移和未执行事实的区别；任何定向绿色结果都不能扩大成产品验收或 release。
  - **范围边界**：本规格不要求修复全部历史失败；要求下一阶段有可执行的分层和关闭条件。
  - **依据**：D-008、F-002、FND-001、PFACT-004
  - **场景**：SCN-004、SCN-010
  - **验收**：AC-010、AC-011

### Review provenance（REVIEW）

- **FR-REVIEW-001**：verify-code 的 completion/close 只能消费唯一 canonical `code_review` ref/hash；`dsh-code-review` 负责执行审查，`wh-review` 使用已有 advisory subject 保留异源建议、原始 finding 和 provenance。
  - **范围边界**：包含唯一完成归属和真实不可用事实；不改写历史 review，不新增 subject、writer 或 review flow。
  - **依据**：D-006、FND-003、PFACT-005、PFACT-006
  - **场景**：SCN-002、SCN-005、SCN-008
  - **验收**：AC-005、AC-006

### 兼容与目录投影（COMPAT）

- **FR-COMPAT-001**：旧 record、旧 projection、legacy reader 和历史 attempt 只有在存在真实 consumer 时才保留最小只读兼容；兼容层不得产生当前 quality fact、completion、close 或 release 依据。
  - **范围边界**：包含归档、删除候选和迁移后的删除条件；不把未知可能性永久视为 consumer。
  - **依据**：D-003、D-005、FND-009、PFACT-008
  - **场景**：SCN-006
  - **验收**：AC-007

- **FR-CATALOG-001**：catalog 必须表达 manifest、stage dependency、bundle closure 和真实 host/CLI consumer 的当前关系；漂移、幽灵声明和 closure 失败只产生诊断事实，不成为普通执行 gate。
  - **范围边界**：包含 projection 的修正或删除；不把 catalog 当质量真相或 release 许可。
  - **依据**：F-003、F-005、G-001、PFACT-007
  - **场景**：SCN-002、SCN-007
  - **验收**：AC-008

### 失败边界、交接和治理报告（HANDOFF）

- **FR-BOUNDARY-001**：workspace、task、stage、材料 revision、snapshot、写入目标或正式发布结构不匹配时，操作必须 fail-loud；失败不能覆盖当前事实或伪造完成。
  - **范围边界**：包含完整性和正式发布安全边界；不把 provider、历史或辅助证据缺失纳入同一硬失败范围。
  - **依据**：D-001、D-007、PFACT-001、PFACT-002
  - **场景**：SCN-003、SCN-008
  - **验收**：AC-004、AC-009

- **FR-HANDOFF-001**：在请求用户确认或交接下一阶段时，必须以用户可见沟通呈现目标、范围、非目标、成功标准、风险、审查事实、未决和延期；不可把 worktree 文件、stage ready、aggregate、空 findings 或绿色测试当作沟通替代品。
  - **范围边界**：包含 WorkflowHub 阶段交接的可见表达；不新增第五材料、第二 communication store 或新的确认 gate。
  - **依据**：R-007、D-007、PFACT-010
  - **场景**：SCN-009、SCN-010
  - **验收**：AC-010

- **FR-REPORT-001**：本批治理交接必须一次性说明修改前后对象、gate、stage、writer、测试数量及职责变化，并分别列出删除、合并、保留、未完成和回滚边界；该报告是交接事实，不是运行时计数 gate。
  - **范围边界**：包含维护者可读的对比和后续 handoff；不新增复杂度计数脚本或运行时 schema。
  - **依据**：R-003、R-006、D-007、FND-011
  - **场景**：SCN-009、SCN-010、SCN-011
  - **验收**：AC-011、AC-012

- **FR-BRANCH-001**：健康基线和当前活动 worktree 保留；恢复 worktree 先形成可回指归档；损坏原始 checkout 继续只读隔离；archive、cleanup、branch 删除必须独立授权。
  - **范围边界**：包含本批治理的分支处置；不授权不可逆 Git 操作。
  - **依据**：D-001、D-008、PFACT-011
  - **场景**：SCN-011
  - **验收**：AC-012

## 6. 模块划分

### 普通执行边界

- **负责什么**：识别当前合法 workspace、核心材料和既有 stage。
- **对外提供什么**：普通任务可以继续的明确结果，或错误身份/写入的明确失败。
- **依赖谁**：用户指定的 trusted worktree、任务材料和既有身份事实。
- **测试边界**：现有 workspace 不被强制重建；错误 workspace 不被静默接受。

### 质量与完成语义

- **负责什么**：区分 quality disclosure、review、freshness、stage completion 和 product release。
- **对外提供什么**：唯一完成/发布结论和不被覆盖的未完成事实。
- **依赖谁**：当前材料、snapshot、review/test facts 和既有 oracle。
- **测试边界**：stale、缺失、冲突、serious finding 和 unavailable 不转成 pass。

### 兼容与能力投影

- **负责什么**：服务真实旧 reader，并准确表达 catalog、dependency、bundle 和 consumer 关系。
- **对外提供什么**：历史可读性和当前能力投影。
- **依赖谁**：真实 consumer、迁移结果和删除条件。
- **测试边界**：兼容层只读；无 consumer 投影可删除；catalog 漂移不冻结普通任务。

### 可见交接与治理报告

- **负责什么**：把当前决定、规格、风险、审查限制、数量职责变化和延期交接给用户。
- **对外提供什么**：用户能直接看到的决策卡和一次性治理报告。
- **依赖谁**：当前四材料、真实 review/test 事实和分支处置事实。
- **测试边界**：文件存在不等于可见沟通；不可用事实必须直接显示。

## 7. 关键实体

- **当前 workspace 绑定**：表示本次任务实际使用的 trusted worktree。
  - **字段和约束**：必须能区分 task、分支、材料 revision 和当前 snapshot；已有 workspace 不得被确定性默认路径替代。
  - **关系**：被普通执行、质量事实和写入边界共同消费；不新增第二 workspace 作为兼容方案。

- **Canonical quality fact**：当前 task/stage/material revision/snapshot 上唯一可被完成判定消费的质量事实。
  - **字段和约束**：必须保留真实状态、来源、ref/hash、freshness 和缺失原因；不能与 quality disclosure 并列成为第二真相。
  - **关系**：由既有唯一 writer 产生，由既有 completion/release oracle 消费。

- **Canonical code review**：verify-code 完成语义唯一消费的 `code_review` 结果。
  - **字段和约束**：绑定唯一 ref/hash 和实际 review bytes；缺失、冲突、stale、unavailable 不得放行。
  - **关系**：`dsh-code-review` 负责执行审查；异源 `wh-review` 不写同名 canonical 完成事实。

- **Advisory review**：不直接决定完成的异源建议和 provenance。
  - **字段和约束**：保留来源、attempt、finding 和 unavailable；不得冒充 canonical completion。
  - **关系**：供维护者审查和处置，不能形成第二 writer 或第二状态机。

- **只读兼容投影**：为真实旧 reader 暂时保留的历史读取边界。
  - **字段和约束**：只读、可回指、不能写 current fact、close 或 release；迁移完成并有负向验证后可删除。
  - **关系**：由真实 consumer 决定是否保留，不因未知可能性永久保留。

- **Catalog projection**：从实际 manifest、dependency、bundle closure 和 consumer 得到的能力关系投影。
  - **字段和约束**：不是真相、不产生推进许可；漂移和幽灵声明可诊断、修正或删除。
  - **关系**：被维护者和 closure 检查消费，不成为普通任务 gate。

## 8. 数据和生命周期

- **数据粒度**：一条当前质量事实对应一个 task、stage、材料 revision、snapshot 和质量 subject；一条 advisory 对应一个独立建议来源；一条兼容投影对应一个真实旧 reader 的读取需要。
- **数据时效**：材料、snapshot、bytes 或适用 stage 变化后，旧结果变为 stale/incomplete；历史记录不回填覆盖当前事实。
- **缺失或迟到**：review、测试、历史、catalog 或辅助证据缺失时保留 unavailable/unknown/incomplete 和原因；不生成默认 pass 或空 findings。
- **状态转换**：沿用现有 `in_progress`、`complete`、`incomplete`、`unavailable`、`stale`、`not_released` 等语义；不新增第二状态机。正常执行只需要从当前 workspace 进入既有 stage，再由既有 oracle 派生完成或未完成。
- **预览与正式**：status、quality disclosure、catalog 和 closure 只能展示事实；formal completion/release 只由既有 oracle 得出。
- **当前与历史**：当前事实绑定当前身份和材料；旧 record、attempt、finding、provenance 和失败事实只读保留，不改写成当前成功。
- **归属与清理**：唯一 current writer 持有当前质量事实；真实旧 reader 决定兼容需求；删除前必须有 consumer 证据、关闭 oracle、失败语义和可回滚点。

## 9. 兼容性预留

- **既有消费方**：status、legacy、mini-task、per-AC 和历史 reader 在迁移前继续读取最小只读兼容层。
- **命名预留**：`code_review` 只代表 canonical completion subject；异源建议使用已有 advisory subject，具体字段映射由 build-plan 固化。
- **容器预留**：沿用现有四件核心材料、质量事实、review、catalog 和 evidence 容器；不新增第五材料或第二 evidence store。
- **状态预留**：沿用 clean/findings/unavailable、fresh/stale、complete/incomplete/not_released 等已有语义；不新增状态值来绕过当前缺口。
- **扩展边界**：允许后续迁移 reader、删除无 consumer 记录、收敛 ref/hash 和修复可见交接；不承诺本规格阶段修复全部历史测试、恢复不可用 provider 或清理分支。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增 public stage、public gate、skill、第二状态机、第二 writer、第二 evidence store、第二 review flow 或第二 close/release 状态机；依据 D-004、D-005、D-006、D-007。
- 不为了 provider、history、catalog、bundle、stage ready 或辅助 evidence 缺失创建第二 workspace；依据 FND-005、FND-006、FND-007。
- 不删除仍有真实 consumer 的旧 record、projection 或 reader；依据 D-003、PFACT-008。
- 不把 `quality_status=passed`、空 findings、closure 通过、stage ready、定向绿色测试或 transport success 解释为产品验收或 release；依据 D-007、FND-001、FND-004～FND-006。
- 不新增复杂度计数脚本、运行时计数 schema、额外 bridge 或负向 option 黑名单；依据 FND-010、FND-011。
- 不在本规格阶段修改代码、测试实现、catalog、bundle、运行时、原始 checkout 或任何分支；不授权 commit、push、merge、archive、cleanup。
- 不把当前 17 个未认证代码/测试 diff 自动纳入本批，不用 reset、clean 或删除来消除它们。

### 默认必须成立

- 当前普通任务优先消费用户已经绑定的合法 workspace；关联 FR-EXEC-001、AC-001。
- 所有正式写入、完成和发布结果都绑定当前身份、材料 revision、snapshot 和真实 bytes；关联 FR-EXEC-002、FR-BOUNDARY-001、AC-002、AC-004、AC-009。
- 所有 unavailable、unknown、incomplete、stale、失败和未发布事实都必须可见且不可被摘要覆盖；关联 FR-TRUTH-001、FR-HANDOFF-001、AC-005、AC-009、AC-010。
- 所有保留和删除判断都必须有 owner、consumer、oracle、失败语义和兼容/回滚条件；关联 FR-COMPAT-001、FR-CATALOG-001、FR-REPORT-001、AC-007、AC-008、AC-011。

## 11. 验收标准

- [ ] **AC-001**：合法的现有 trusted worktree 可以进入普通任务，不需要第二 workspace 或强制确定性路径。
  - **需求**：FR-EXEC-001
  验证：用一个已存在且合法的 trusted worktree 走普通启动和继续路径。
  - **通过条件**：任务绑定该 worktree 并继续既有 stage；确定性路径只影响新建默认值。
  - 失败：要求额外 workspace、固定分支名，或因路径命名差异阻止普通任务。
  - **证据类型**：`test`

- [ ] **AC-002**：核心材料、身份、revision、snapshot 和 freshness 使用一套当前语义。
  - **需求**：FR-EXEC-002
  验证：检查正常、旧路径、缺失材料和 stale 结果的可观察状态。
  - **通过条件**：当前材料有唯一解释；旧路径只读兼容；缺失和 stale 有真实原因。
  - 失败：系统根据文件是否存在猜测当前真相，或旧路径可以写当前事实。
  - **证据类型**：`test`

- [ ] **AC-003**：public stage/gate/state/writer/evidence store 数量不增加，重复控制表面有明确合并或删除归属。
  - **需求**：FR-CONTROL-001
  验证：对比治理前后职责清单和实际 consumer。
  - **通过条件**：新增项为零；每个保留项都有唯一 owner、真实 consumer、completion oracle 和失败语义。
  - 失败：为解决缺口新增第二套流程、状态、writer、evidence 或永久 wrapper。
  - **证据类型**：`evidence`

- [ ] **AC-004**：错误 workspace、写入目标、hash、snapshot 或正式发布结构会 fail-loud，且不会覆盖当前事实。
  - **需求**：FR-BOUNDARY-001、FR-TRUTH-001
  验证：执行身份不匹配、冲突 bytes、stale 结果和正式发布结构错误场景。
  - **通过条件**：操作失败并保留原因；没有伪造 completion、close 或 release。
  - 失败：错误结果被接受、覆盖当前事实或被记为普通 advisory。
  - **证据类型**：`test`

- [ ] **AC-005**：辅助 review、历史、catalog 或证据不可用时，普通任务可以继续但状态不会变成 pass。
  - **需求**：FR-TRUTH-001、FR-REVIEW-001
  验证：模拟 provider unavailable、历史缺失、catalog 漂移和辅助 evidence 缺失。
  - **通过条件**：继续普通工作；用户看到 unavailable/unknown/incomplete 和原因；没有空 findings 或 release-ready。
  - 失败：辅助事实缺失冻结普通任务，或被改写成 clean/pass。
  - **证据类型**：`test`

- [ ] **AC-006**：verify-code completion/close 只消费唯一 canonical `code_review` ref/hash。
  - **需求**：FR-REVIEW-001
  验证：检查执行审查、异源 advisory、同名结果、缺失 ref/hash、冲突和 stale 场景。
  - **通过条件**：`dsh-code-review` 是唯一完成 owner；`wh-review` 建议和 provenance 可追溯但不能独立放行。
  - 失败：两个同名结果均能放行、advisory 被抹掉，或 bytes/ref/hash 无法绑定。
  - **证据类型**：`test`

- [ ] **AC-007**：旧记录只在真实 consumer 存在时保留最小只读兼容，无 consumer 项有归档、删除和回滚条件。
  - **需求**：FR-COMPAT-001
  验证：逐项核对 reader、历史读取、迁移后读取和删除后的负向行为。
  - **通过条件**：真实 reader 仍可读；兼容层不能写当前事实；无 consumer 项可安全删除或归档。
  - 失败：误删真实 reader、旧记录冒充当前事实，或没有 consumer 证据却永久保留。
  - **证据类型**：`test`

- [ ] **AC-008**：catalog、manifest、dependency、bundle closure 和真实 consumer 的关系可解释，漂移不成为普通执行 gate。
  - **需求**：FR-CATALOG-001
  验证：静态关系核对和 closure/consumer 结果审查。
  - **通过条件**：真实消费、幽灵声明、修正项和删除候选可逐项说明；closure 通过不扩大为产品验收。
  - 失败：catalog 把无 consumer 项宣称为当前能力，或漂移阻止普通任务。
  - **证据类型**：`test`

- [ ] **AC-009**：quality disclosure、stage completion 和 product release 三种语义不能互相冒充。
  - **需求**：FR-TRUTH-001
  验证：检查 `passed` 与 `in_progress`、stale、serious finding、incomplete 和 not released 的组合。
  - **通过条件**：只有既有 completion/release oracle 能给出正式结论；质量摘要不覆盖缺失事实。
  - 失败：单个摘要字段触发 close/release，或空 findings 被当成验收。
  - **证据类型**：`test`

- [ ] **AC-010**：用户可见沟通中包含当前决策、范围、非目标、成功标准、风险、审查限制、未决和延期。
  - **需求**：FR-HANDOFF-001、FR-TRUTH-002
  验证：人工查看当前阶段交接消息，并与四件核心材料逐项对照。
  - **通过条件**：用户无需猜测 worktree 文件内容；unavailable、失败和未完成事实直接可见。
  - 失败：只提供文件路径、绿色测试、stage ready 或 aggregate，要求用户据此自行确认。
  - **证据类型**：`manual`

- [ ] **AC-011**：治理交接一次性给出对象、gate、stage、writer、测试数量和职责的前后对比，并保留全量测试非绿事实。
  - **需求**：FR-REPORT-001、FR-TRUTH-002
  验证：阅读治理报告和测试事实分层。
  - **通过条件**：删除、合并、保留、未完成、延期和回滚边界齐全；不把定向通过扩大为绿色或 release。
  - 失败：新增复杂度计数运行时、删除失败记录，或只报告通过项。
  - **证据类型**：`evidence`

- [ ] **AC-012**：分支/worktree 处置遵守独立授权边界。
  - **需求**：FR-BRANCH-001
  验证：检查健康基线、活动 worktree、恢复 worktree 和原始 checkout 的状态与授权记录。
  - **通过条件**：基线和活动 worktree 保留；恢复材料先归档；原始 checkout 未写入；未授权 cleanup/merge/push 未发生。
  - 失败：用 reset/clean/prune/删除替代归档，或把恢复材料当成产品代码/release 证据。
  - **证据类型**：`evidence`

## 12. 风险、未决与交接

- **规格澄清**：`spec-clarify trigger=false`。当前没有需要用户重新选择的产品方向；剩余 OPEN 项只影响 build-plan 的接口、迁移、删除 oracle 和回滚细节。

- **RISK-SPEC-001：现有 workspace 绑定契约仍可能把默认路径当强制路径**
  - **受影响 ID**：PFACT-002、FR-EXEC-001、AC-001
  - **触发条件**：实现时仍要求固定 task workspace 或固定分支名。
  - **后果**：合法普通任务继续被 ENOENT 阻塞。
  - **缓解或 STOP**：先定义一次性当前 workspace 认证和失败语义；无法消费现有 trusted worktree 时 STOP，不创建第二 workspace。
  - **处理 Stage**：`build-plan`
  - **验证**：现有 workspace 正常路径和错误身份负向场景。

- **RISK-SPEC-002：canonical review 的 advisory subject、ref/hash 和外部 reader 映射未完全确定**
  - **受影响 ID**：PFACT-005、FR-REVIEW-001、AC-006
  - **触发条件**：外部 reader 仍依赖同名 `wh-review code_review`。
  - **后果**：provenance 继续分叉，或迁移时误删历史读取。
  - **缓解或 STOP**：build-plan 先列真实 reader、唯一 canonical bytes/ref/hash、迁移和回滚；证据不足时只读兼容，不新增第三对象。
  - **处理 Stage**：`build-plan`
  - **验证**：缺失、冲突、stale、unavailable 和旧 reader 负向场景。

- **RISK-SPEC-003：旧记录和兼容投影存在未知 consumer**
  - **受影响 ID**：PFACT-008、FR-COMPAT-001、AC-007
  - **触发条件**：目录、代码、运行时或交付材料出现实际读取证据。
  - **后果**：误删会破坏历史读取；永久保留会继续增加维护成本。
  - **缓解或 STOP**：以真实 consumer 证据决定最小只读兼容；无证据先做可恢复归档，禁止永久冻结 live 控制面。
  - **处理 Stage**：`build-plan`
  - **验证**：consumer 清单、迁移完成、删除后的负向读取和回滚点。

- **RISK-SPEC-004：catalog/bundle closure 通过但消费关系仍漂移**
  - **受影响 ID**：PFACT-007、FR-CATALOG-001、AC-008
  - **触发条件**：manifest、dependency、catalog 或 host consumer 变化。
  - **后果**：错误保留或删除 skill/bundle，维护面继续膨胀。
  - **缓解或 STOP**：以真实 consumer 修正 projection；不把 closure 变成 public gate。
  - **处理 Stage**：`build-plan`
  - **验证**：逐项 used-by/effective closure/ghost consumer 关系。

- **RISK-SPEC-005：全量测试失败和精确数量口径需要重新统一**
  - **受影响 ID**：PFACT-004、FR-TRUTH-002、AC-011
  - **触发条件**：进入实现修复或判断本批完成。
  - **后果**：可能把基线噪音、环境问题或未执行事实误报为治理完成。
  - **缓解或 STOP**：保留既有非绿事实；build-plan 统一复核口径并按治理相关、外部噪音、环境漂移和未执行分层，不以归零为目标。
  - **处理 Stage**：`build-plan`
  - **验证**：同一测试口径的失败清单、修复范围和未执行原因。

- **RISK-SPEC-006：wh-review 和 interaction aggregate 当前不可用**
  - **受影响 ID**：PFACT-006、PFACT-010、FR-TRUTH-001、FR-HANDOFF-001、AC-005、AC-010
  - **触发条件**：需要正式阶段质量声明或独立异源建议时。
  - **后果**：质量声明不完整，不能声称正式 review 完成。
  - **缓解或 STOP**：保留原始 `unavailable/ENOENT` 和可见沟通；不创建第二 workspace 绕过；另行授权后重新取得真实事实。
  - **处理 Stage**：`build-plan`
  - **验证**：真实 provider terminal result、当前可见交接和 stage outcome。

- **RISK-SPEC-007：当前用户可见沟通根因尚未定位**
  - **受影响 ID**：PFACT-010、FR-HANDOFF-001、AC-010
  - **触发条件**：用户仍只能看到文件链接而看不到完整决策卡。
  - **后果**：用户无法有效确认，文件存在也不能证明沟通完成。
  - **缓解或 STOP**：当前阶段直接在用户可见消息呈现完整卡片；具体 host/UI projection 根因留后续治理，不新增第二 communication store。
  - **处理 Stage**：`build-plan`
  - **验证**：用户能复述当前目标、范围、风险和确认选项。

- **RISK-SPEC-008：分支清理可能丢失未跟踪交接材料**
  - **受影响 ID**：PFACT-011、FR-BRANCH-001、AC-012
  - **触发条件**：有人以“两个分支同一 HEAD”为理由直接删除恢复 worktree。
  - **后果**：未归档的 task/evidence 材料不可恢复。
  - **缓解或 STOP**：先建立可回指归档并验证可读，再单独请求 archive/cleanup 授权。
  - **处理 Stage**：后续独立清理任务
  - **验证**：归档可读、路径可回指、独立授权存在。

- **OPEN-SPEC-001：当前 workspace 认证如何既支持已有 worktree 又不恢复强制确定性路径**
  - **受影响 ID**：FR-EXEC-001、AC-001
  - **owner**：后续 build-plan owner
  - **影响**：决定普通任务是否真的解除 ENOENT 阻塞。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：已有 trusted worktree 能直接通过一次认证并进入普通 stage；否则 STOP 创建第二 workspace。

- **OPEN-SPEC-002：canonical review 的精确 advisory subject、ref/hash 和 reader 映射**
  - **受影响 ID**：FR-REVIEW-001、AC-006
  - **owner**：后续 build-plan owner
  - **影响**：决定双同名链能否安全收敛。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：真实 reader、唯一 bytes/ref/hash、迁移和回滚事实齐全；否则只读兼容，不删除历史。

- **OPEN-SPEC-003：每条旧 projection、旧 record、legacy reader 的真实 consumer、oracle 和删除条件**
  - **受影响 ID**：FR-COMPAT-001、AC-007
  - **owner**：后续 build-plan owner
  - **影响**：决定维护成本是否真正下降以及历史读取是否安全。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：逐项有 consumer/owner/oracle/失败语义/回滚点；缺证据时保留最小只读兼容或归档。

- **OPEN-SPEC-004：当前 observed 25 个 tracked diff 的来源、授权和是否属于本批（17-file 只作历史快照）**
  - **受影响 ID**：PFACT-009、FR-GOV-001、FR-TRUTH-002、AC-001、AC-011
  - **owner**：后续 build-plan owner与用户授权边界
  - **影响**：决定实现范围、测试归因和回滚方式。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：逐项完成来源、需求、consumer、oracle、测试和回滚映射并得到授权；否则不修改、不删除、不提交。

- **OPEN-SPEC-005：阶段交接的用户可见投影具体由哪个现有 host consumer 提供**
  - **受影响 ID**：PFACT-010、FR-HANDOFF-001、AC-010
  - **owner**：后续 build-plan owner
  - **影响**：决定如何让用户在确认前看到完整决策，而不引入第二 communication store。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：现有 host/UI 能展示完整交接；若现有投影不能表达，先回到 make-decision 说明最小边界，不偷偷新增流程。

## 13. 业务影响与回归范围

### WorkflowHub 普通任务执行

- **既有行为**：合法 workspace 可能因确定性路径或内部辅助控制面不匹配而停止。
- **本需求影响**：普通任务直接消费当前 trusted worktree；辅助事实缺失只显示真实质量限制，不单独冻结。
- **回归路径**：正常启动、继续任务、workspace 错误、材料 stale、provider unavailable、普通 completion 和未发布交接。
- **验收**：AC-001、AC-004、AC-005、AC-009。

### 质量、review 和历史兼容

- **既有行为**：quality、completion、review 和旧 projection 可能被多个表面同时解释。
- **本需求影响**：唯一 canonical completion owner，异源 advisory 和历史事实保留但不争夺完成语义。
- **回归路径**：双 review、ref/hash 冲突、旧 reader、无 consumer 删除候选、catalog 漂移和状态组合。
- **验收**：AC-003、AC-006、AC-007、AC-008。

### 交接和维护成本

- **既有行为**：材料可能存在，但用户看不到完整决策；测试和分支事实容易被绿色摘要覆盖。
- **本需求影响**：交接直接呈现完整决策卡、真实限制、数量职责变化、延期和回滚边界。
- **回归路径**：用户确认、规格交接、全量测试失败分层、分支保留和独立清理授权。
- **验收**：AC-010、AC-011、AC-012。

- **可能受冲击的业务规则**：历史 reader、review completion consumer、catalog 删除判断、workspace 认证和阶段交接。
- **明确无影响**：PaperBuilder 产品行为、五阶段数量、用户产品方向、既有 canonical writer、既有 completion/release oracle 和原始 checkout 内容。

## 规格阶段交接

- `build-plan` 必须先处理 OPEN-SPEC-001～005 和 RISK-SPEC-001～008，不得自行发明新的 public gate/stage/state/writer/evidence store。
- `build-plan` 必须把每个保留项落到真实 owner、consumer、completion oracle、失败语义、兼容/删除条件和回滚点。
- `build-plan` 必须保留 `wh-review` 的 `unavailable/ENOENT`、interaction aggregate 不可用、全量测试非绿和未归属代码 diff，不得把它们改写成通过。
- 本规格不授权代码修改、commit、push、merge、archive 或 cleanup；这些动作必须遵守各自阶段和独立授权边界。

