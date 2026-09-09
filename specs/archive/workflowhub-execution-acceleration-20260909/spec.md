# 功能规格：WorkflowHub 执行加速与阻塞削减

- **功能名**：审查耐久、窄上下文阶段协调与逐 AC 新鲜度
- **来源**：decision-log.md R-001～R-026、D-001～D-012
- **状态**：已接受方向的规格草案
- **内容合同**：spec-content.v3

## 材料导航

| 章节 | 摘要 | 读取时机 |
| --- | --- | --- |
| 速读卡与来源 | 本期目标、范围与决定来源 | M/S 接收任务时 |
| 场景与事实 | 用户可观察状态和可信前提 | S/B 分析行为时 |
| 功能需求与验收 | 当前行为合同和判真边界 | S/B/P 实施与核验时 |
| 风险与交接 | 延期、停止条件与责任人 | M/S/B/P 阶段交接时 |

## 速读卡（30 秒）

- **一句话需求**：WorkflowHub 用户执行复杂任务时，审查在花费昂贵调用前识别必败输入，中断后可恢复已完成结果，主会话不再承载重读与轮询，同时逐 AC 事实只容忍不改变结果含义的材料修订变化。
- **核心改动点**：审查派发前边界与可恢复生命周期；主会话四职责和窄 worker 合同；测试运行画像；逐 AC 新鲜度容忍。
- **最大影响面**：五阶段中的审查调用、阶段协调、测试路由描述和逐 AC 完成投影。
- **验收信号**：必败审查五秒内且零 provider 调用；中断后复用至少一个已完成成员；非材料写入不触发漂移；主会话输入占比低于 25%。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-002,R-010,R-014,R-015 | D-001,D-003,D-004,D-005 | FR-REVIEW-001～004 / AC-REVIEW-000～005 | current / review lifecycle | 无产品歧义 |
| R-005,R-013,R-020 | D-002,D-007,D-009 | FR-COORD-001～003 / AC-COORD-001～004 | current / stage coordination | 指标由任务事实核验 |
| R-018 | D-007,D-009 | FR-TEST-001 / AC-TEST-001～002 | current / test description | 实际 fixture 加速 deferred |
| R-011,R-019 | D-006 | FR-FRESH-001 / AC-FRESH-001～002 | current / per-AC projection | 无产品歧义 |
| R-008,R-009,R-016,R-017,R-021 | D-010 | DEFER-S3～S7 | deferred / later tasks | 触发后回各 owner |
| R-024,R-025 | D-003,D-009 | FR-REVIEW-004,FR-COORD-003 | current / governance | 不新增 gate/store/stage |
| R-026 | D-012 | FR-REVIEW-005 / AC-REVIEW-006 | current / review budget | 仅真实 provider 失败 + 宿主认证 route identity 变化 + 同 revision 一次 |

## 1. 问题与紧迫性

上次复杂任务花费约 25 小时，审查曾在多个 provider 已完成后因外层中断或材料漂移丢失结果；主会话反复承载大上下文并轮询，root 输入占约 51%。如果继续沿用同步等待、活 worktree 漂移和全量上下文继承，执行时间与失败概率会继续随任务规模放大。本期必须在不伪造质量、不新增放行 gate 的前提下缩短必败路径并保存已完成工作。

## 2. 背景、目标与范围

### 规格澄清

spec-clarify trigger=false；理由：D-001～D-012 已确认交付 S1、完整 S2、逐 AC material-only 容忍与受认证 route repair 单次预算，技术调查只细化既定边界，没有需要用户重新选择的产品方向；开放方向性问题：0。

conditional-spec-research：executed；理由：必须核实现有审查、broker、阶段 packet 和逐 AC 新鲜度能力，才能区分复用与缺失接线。研究确认已有冻结身份、内容寻址发布和 broker start/status，尚缺 WorkflowHub 接线、窄返回强制和测试运行画像合同。研究只提供事实，不替代本规格与用户决定。

### 背景

WorkflowHub 已有五阶段、四份当前材料、独立审查入口、冻结输入 packet、输入字节边界、broker 兼容探测、内容寻址结果与阶段 outcome。本期扩展这些现有职责，不建立第二套流程。

### 目标

- 审查在 provider 调用前处理可确定的失败，并在调用后可凭稳定身份恢复。
- 主会话只负责交互、派发、整合、裁决；读重工作可并行，写入保持单写者。
- 测试同时声明既有 test tier 与正交的 test runtime profile。
- 逐 AC 事实只在结果语义完全未变时容忍 material revision 变化。

### 范围内

- S1：审查派发前 token/context/兼容性边界、start/status 恢复、漂移材料闭包、精确错误分类。
- S2：阶段协调职责、窄 worker brief/return、只读并发上限、无 sleep polling、测试运行画像合同和一次性能画像。
- 逐 AC material-only 新鲜度容忍。
- ADR 0025 对两个冲突治理句子的显式修订。

## 3. 用户场景与状态覆盖

### SCN-001：必败审查在派发前返回
- **角色**：阶段执行者。
- **Given**：审查输入缺材料、含禁止材料、超过可信边界，或 broker 明确不兼容。
- **When**：用户发起审查。
- **Then**：五秒内得到具体错误和可追溯 attempt；没有 provider 调用，不被解释为质量通过。

### SCN-002：健康事实未知但静态输入合法
- **角色**：阶段执行者。
- **Given**：输入满足字节边界，但 token/context 上限或健康状态没有可信来源。
- **When**：用户发起审查。
- **Then**：未知保持 unknown，并按已有边界继续；后续真实失败如实记录。

### SCN-003：中断后恢复审查
- **角色**：恢复同一任务的用户。
- **Given**：请求已有稳定 request identity 和 runtime identity，至少一个 provider 已完成。
- **When**：调用方中断后恢复。
- **Then**：状态查询复用原 runtime 和已完成成员；终态再由现有唯一 writer 发布 canonical 结果。

### SCN-004：dispatch 期间有非材料写入
- **角色**：阶段协调者。
- **Given**：审查绑定冻结 subject/material closure。
- **When**：worktree 出现不在闭包内的日志或规划辅助文件变化。
- **Then**：结果照常记录，不出现 source drift。

### SCN-005：dispatch 期间材料变化
- **角色**：阶段协调者。
- **Given**：审查已绑定冻结材料。
- **When**：闭包内材料或受审 source digest 变化。
- **Then**：结果不绑定为当前质量；写一个 unavailable attempt，保留已完成成员事实，并提示以新身份重新请求。

### SCN-006：主会话派发只读 worker
- **角色**：主会话。
- **Given**：任务是可独立的探查、测试或审查。
- **When**：主会话派发自足 brief。
- **Then**：worker 仅返回不超过 500 字的结论、引用和 hash；主会话不接收轨迹。

### SCN-007：并行读取与串行写入
- **角色**：阶段协调者。
- **Given**：存在多个独立只读任务或一个材料/实现写任务。
- **When**：安排工作。
- **Then**：只读默认并发不超过 3、硬上限 6；写入只有一个 owner，依赖工作串行。

### SCN-008：测试声明运行画像
- **角色**：计划与实现执行者。
- **Given**：测试已有 simple、feature 或 fullstack tier。
- **When**：为其选择运行路径。
- **Then**：另行声明 inner、medium 或 large profile，权限和时长边界明确，二者互不替代。

### SCN-009：逐 AC 事实跨材料修订复用
- **角色**：完成投影消费者。
- **Given**：已有一条当前 AC 结果及其证据身份。
- **When**：只有 material revision 变化。
- **Then**：仅当 snapshot tree、证据 hash、AC ID 与结果都完全一致时复用，并保留原 revision provenance；任一其他变化均 stale。

### SCN-010：当前 task 本地 aggregate
- **角色**：验收者。
- **Given**：当前认证 task 的四份材料、实现和 P1-P5 targeted receipts 可读；没有真实 task 或 host usage 绑定。
- **When**：执行一次当前 worktree 本地 aggregate，逐项读取 targeted receipt、材料/源码身份和已知缺失的 telemetry。
- **Then**：同时验证 review/coordination/freshness 的本地合同；AC-COORD-001/004 的 live 指标缺失必须输出 `unavailable`，不得默认成零或达标；本场景不声称真实任务复跑或统计结论。真实 task/host usage 由 D-011 之后的独立 evidence 补充。

### SCN-011：真实 provider 失败后完成受认证路由修复
- **角色**：同 task 的审查调用方。
- **Given**：同一 task/stage/subject/material revision 已有 canonical dispatched terminal unavailable/failed attempt；每个已选择 provider 都有受认证 failed/cancelled 成员事实且没有 semantic output。
- **When**：宿主重新解析当前可信 route，得到与前次 canonical attempt 不同的 `route_identity`。
- **Then**：既有 budget owner 只允许一次非 phase `route_repair` 重试；request 不能自报修复。零 provider attempt、status/runtime/protocol/material/closure/drift/mismatch 错误、identity 未变化或第二次 route repair 均 fail closed；blocked-before-dispatch 不获得 `route_repair`，但仍保留既有“修好 preflight 后首次 initial dispatch”语义；phase review 保留每 revision 一次。

### 状态覆盖清单

- [x] **默认态**：SCN-003、SCN-006。
- [x] **空态**：SCN-001 覆盖空材料和零 provider attempt。
- [x] **错误态**：SCN-001、SCN-005。
- [x] **修复态**：SCN-011 仅覆盖真实 provider failure 后的受认证 route repair，不扩展为通用 recovery/reopen。
- [x] **加载态**：SCN-003 的 starting/running 状态。
- [x] **取消态**：取消保持真实终态且不伪造结果；归入 SCN-003。
- [x] **边界态**：SCN-002、SCN-007、SCN-008。
- [x] **权限态**：SCN-008 声明网络、数据库、文件系统、子进程和 CI 权限。
- [x] **竞态**：SCN-004、SCN-005 以及同 request identity 幂等恢复。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：broker 已提供 start、status、cancel 和 request identity 幂等语义。
  - **status**：verified
  - **证据或来源**：decision-log F-019、D-005。
  - **关联**：FR-REVIEW-002、AC-REVIEW-000、AC-REVIEW-003。
- **PFACT-002**：WorkflowHub 当前审查调用仍为同步等待，尚未消费可恢复生命周期。
  - **status**：verified
  - **证据或来源**：conditional research 与 D-005。
  - **关联**：FR-REVIEW-002、AC-REVIEW-000、AC-REVIEW-003。
- **PFACT-003**：已有冻结 packet、输入字节边界、兼容探测与 create-only publication 可扩展。
  - **status**：verified
  - **证据或来源**：decision-log G-001～G-003、D-003。
  - **关联**：FR-REVIEW-001、FR-REVIEW-003、AC-REVIEW-001、AC-REVIEW-004。
- **PFACT-004**：没有可信 provider token/context 上限时，不能把字符估算伪称为精确 token 判定。
  - **status**：verified
  - **证据或来源**：conditional research；限制缺失时保持“未知”而不猜测。
  - **关联**：FR-REVIEW-001、AC-REVIEW-002。
- **PFACT-005**：主会话占上次任务输入 token 约 51%，并发生大量 sleep/wait 事件。
  - **status**：verified
  - **证据或来源**：R-013、D-002。
  - **关联**：FR-COORD-001、FR-COORD-002、AC-COORD-001～004。
- **PFACT-006**：本任务不包含 UI 或页面变化。
  - **status**：not_applicable
  - **不适用理由**：交付面是 CLI、运行时合同与执行事实。
  - **关联**：FR-COORD-003、AC-COORD-004。
- **PFACT-007**：测试运行画像目前没有独立生产合同。
  - **status**：verified
  - **证据或来源**：D-007 与 conditional research。
  - **关联**：FR-TEST-001、AC-TEST-001～002。
- **PFACT-008**：现有逐 AC 新鲜度把 material revision 与其他身份变化共同处理，无法表达批准的窄容忍。
  - **status**：verified
  - **证据或来源**：D-006、F-018。
  - **关联**：FR-FRESH-001、AC-FRESH-001～002。
- **PFACT-009**：现有 review budget 在同 material revision 已 dispatch 后不会因真实 route identity 修复而增加受限机会。
  - **status**：verified
  - **证据或来源**：`runtime/review/review-record-route.mjs` 的 material revision/kind 预算选择与 `runtime/evidence/stage-content-evidence.mjs` 的 kind validator。
  - **关联**：FR-REVIEW-005、AC-REVIEW-006。

## 5. 功能需求

### 审查派发与耐久（REVIEW）

- **FR-REVIEW-001**：系统必须在任何 provider 调用前完成可确定的路由、材料、字节、可信 token/context 和兼容性检查；失败统一进入 blocked_before_dispatch attempt，附稳定错误分类、诊断和下一步，且不影响阶段继续修复。
  - **范围边界**：未知健康或未知 token 上限保持 unknown，不猜测失败；所有 provider 前可知的超界都属于本行为。
  - **依据**：D-003、D-004、PFACT-003、PFACT-004。
  - **场景**：SCN-001、SCN-002。
  - **验收**：AC-REVIEW-000～002。
- **FR-REVIEW-002**：系统必须以确定性 request identity 启动 broker managed run，立即持久化 runtime identity，并在恢复时用 status 复用同一运行；只在终态通过现有唯一 writer 发布结果。
  - **范围边界**：不改 broker provider 协议；running 期间的成员耐久由 broker 状态承担，不新增第二 store。
  - **依据**：D-003、D-005、PFACT-001、PFACT-002。
  - **场景**：SCN-003。
  - **验收**：AC-REVIEW-000、AC-REVIEW-003。
- **FR-REVIEW-003**：drift 必须比较不可变 closure manifest（受审 source refs/hashes、材料 scope/revision、snapshot tree、packet hash）；闭包外写入不得失效；在 start 前、最后成员完成后和 canonical publication 内必须二次认证闭包，闭包内变化留下 unavailable attempt并隔离晚到结果，同时保留可认证成员事实。
  - **范围边界**：不把 live worktree 的任何变化都提升为材料变化。
  - **依据**：D-005、PFACT-003。
  - **场景**：SCN-004、SCN-005。
  - **验收**：AC-REVIEW-000、AC-REVIEW-004、AC-REVIEW-005。
- **FR-REVIEW-004**：预检、运行、取消、不可用、部分可用和完成状态必须保持原始事实；unknown、unavailable、incomplete 均不得成为 pass；完整审查的空 findings 是 clean 候选事实，但仍不单独构成质量或发布许可；不得新增放行 gate。
  - **范围边界**：错误码至少区分路由不可用、材料缺失、禁止材料、输入过大、broker 启动失败和协议不兼容。
  - **依据**：D-003、D-004、D-009。
  - **场景**：SCN-001～SCN-005。
  - **验收**：AC-REVIEW-000～005。
- **FR-REVIEW-005**：同一 material revision 的非 phase 审查，只有在 canonical history 证明前次审查已真实 dispatched、terminal unavailable/failed、全部已选 provider 成员 failed/cancelled 且没有 semantic output，并且宿主当前重算 `route_identity` 与前次不同，才可由既有 budget owner 增加一次 `route_repair`；同 revision 不得增加第二次。
  - **范围边界**：request 不得提交或覆盖 repair 判定；`provider_attempts=[]`、blocked-before-dispatch、status/runtime/protocol/material/closure/drift/mismatch 错误不合格；不新增 reopen/recovery/continuation public flow。
  - **依据**：D-012、PFACT-009。
  - **场景**：SCN-011。
  - **验收**：AC-REVIEW-006。

### 阶段协调与上下文（COORD）

- **FR-COORD-001**：主会话只承担交互、派发、整合和裁决；重读探查、测试和独立审查必须由窄上下文 worker 执行。
  - **范围边界**：主会话可以做一两行微动作，但不得默认继承或内联完整历史。
  - **依据**：D-002、PFACT-005。
  - **场景**：SCN-006、SCN-010。
  - **验收**：AC-COORD-001、AC-COORD-002。
- **FR-COORD-002**：worker brief 必须自足并绑定任务、阶段、材料修订、快照、源摘要和任务边界；返回只含不超过 500 字的 conclusion、ref、sha256，不回传轨迹。
  - **范围边界**：窄返回是 transport summary，不替代 stage outcome 或质量 evidence。
  - **依据**：D-002、D-003、PFACT-005。
  - **场景**：SCN-006。
  - **验收**：AC-COORD-002。
- **FR-COORD-003**：只有互不依赖的读取可并行，默认并发上限 3；每个 phase 的 worker 总数与并发峰值硬上限均为 6，第 7 个请求必须停止并回主会话重新切分；材料与实现写入始终单 owner，长任务通过有界完成事件推进，不使用 sleep polling。
  - **范围边界**：不引入 dispatcher 名称，不新增调度运行时或第五份材料。
  - **依据**：D-002、D-007、D-009、PFACT-006。
  - **场景**：SCN-007、SCN-010。
  - **验收**：AC-COORD-003、AC-COORD-004。

### 测试运行画像（TEST）

- **FR-TEST-001**：每个计划测试除 test tier 外必须声明 test runtime profile、最长时长、网络、数据库、文件系统、子进程和运行环境权限；inner 为不超过 60 秒且禁用这些外部能力，medium 为不超过 300 秒且仅允许显式 localhost 能力，large 仅允许 CI 并必须声明上限和所需能力。
  - **范围边界**：本期只提供合同、分类检查和一份行为保持的性能画像，不改 fixture、不承诺实际提速、不把画像变成质量 gate。
  - **依据**：D-007、D-009、PFACT-007。
  - **场景**：SCN-008。
  - **验收**：AC-TEST-001、AC-TEST-002。

### 逐 AC 新鲜度（FRESH）

- **FR-FRESH-001**：逐 AC 完成事实可以只容忍 material revision 不同；复用前必须逐字段确认 task、AC ID、结果、snapshot tree、证据 ref/hash 和适用输入完全一致，并保留原 revision provenance。
  - **范围边界**：snapshot tree、证据、AC 结果或身份任一变化都 stale；不扩展为 repair delta 或 resolved 链。
  - **依据**：D-006、PFACT-008。
  - **场景**：SCN-009。
  - **验收**：AC-FRESH-001、AC-FRESH-002。

### 审查生命周期与记录所有权

| 状态/事件 | 唯一 owner 与容器 | 可观察转移 | 失败语义 |
| --- | --- | --- | --- |
| preflight | 既有审查 route；transient request + canonical attempt | 合法→managed start；必败→blocked_before_dispatch | 阻断 attempt 的 provider 数为 0 |
| starting/running | broker runtime；WorkflowHub 仅持久化 runtime ref 到既有 attempt | status→running/terminal/cancelled | start failure→REVIEW_BROKER_START_FAILED；start 成功而调用方中断时，以同一 deterministic request identity 再次 start，broker 幂等返回原 runtime，再进入 status；不要求先写可丢失的第二份 runtime 记录 |
| terminal partial/completed | broker terminal group → 既有 canonical writer | available-with-failures/clean/findings/unavailable | late member 只归原 runtime，不改另一 request |
| cancelled/expired/missing | broker runtime + 既有 attempt | cancelled→unavailable；expired→REVIEW_RUNTIME_EXPIRED；missing→REVIEW_RUNTIME_MISSING；同 request 重新 start 仅按 broker 现有幂等/TTL 语义恢复，若 binding 已过期则必须形成显式新 request identity并保留旧 unavailable attempt | 禁止扫描 latest 或静默全量重派 |
| publish | 既有 create-only canonical writer | 最终 closure 二次认证成功→单次发布；失败→unavailable attempt | 既有 canonical writer 的同一临界区内对 manifest 引用的实际材料 bytes/hash 做最后比较并 create-only publish；比较或写入任一失败即 fail closed，结果隔离为历史成员事实 |

status 查询由 review runtime/宿主后台任务拥有；主会话只接收一次启动引用、必要的一次恢复裁决和终态事件，不循环轮询。attempt 本身 immutable：运行态进展保留在 broker；终态一次性构造 canonical attempt/result，不对已发布 attempt 追加修改。

### 错误分类

| code | 触发 | dispatch/provider | 投影与下一步 |
| --- | --- | --- | --- |
| ROUTE_UNAVAILABLE | 无合法异源路线 | blocked / 0 | unavailable；修复 route |
| MATERIAL_INCOMPLETE | 必需材料缺失 | blocked / 0 | incomplete；补当前材料 |
| MATERIAL_FORBIDDEN | packet 含禁止材料 | blocked / 0 | unavailable；删除越界材料 |
| REVIEW_INPUT_TOO_LARGE | 字节或可信 token/context limit 超界 | blocked / 0 | unavailable；缩小受审 closure |
| PROTOCOL_INCOMPATIBLE | broker 明确不兼容 | blocked / 0 | unavailable；升级/修复协议 |
| REVIEW_BROKER_START_FAILED | managed start 失败 | blocked / 0 | unavailable；保留诊断后修复环境 |
| REVIEW_STATUS_UNAVAILABLE | runtime status 暂时不可读 | dispatched / 保留原数 | unavailable；重试同 runtime status，不重派 |
| REVIEW_RUNTIME_EXPIRED | runtime 已由 broker TTL 清理 | dispatched / 保留原数 | unavailable；新 request identity 才可重派 |
| REVIEW_RUNTIME_MISSING | runtime 从未存在或 binding 不匹配 | dispatched / 保留原数 | unavailable；核实 request binding，禁止猜测 |
| REVIEW_SOURCE_DRIFT | manifest 中材料 bytes/hash 改变 | dispatched / 保留原数 | unavailable；以新材料 identity 请求，晚到成员隔离 |
| REVIEW_PROVIDER_FAILED / provider member failed/cancelled | 已真实 dispatch，所有已选成员均有受认证失败事实且无 semantic output | dispatched / 保留原数 | 只有宿主重算 route identity 已变化时可消费一次 route_repair；否则保持 unavailable |

每类均须保留 sanitized diagnostic、actual/expected、next action；unknown health/token limit 不属于错误码。

### 复用与消费者登记

| 概念 | 既有容器/持久性 | owner → consumer | 删除/替代条件 |
| --- | --- | --- | --- |
| request/runtime identity | review request key + attempt runtime ref；仅必要绑定持久 | review route/broker → status recovery | broker 提供等价可认证恢复绑定 |
| worker brief | stage-input-packet 扩展；transient/content-addressed packet | stage coordination → host worker | stage packet 原生覆盖全部字段 |
| worker summary | host transport 返回；ref 指向既有 evidence，不建 store | host worker → main session/stage outcome | 宿主提供等价窄返回协议 |
| test runtime profile | 既有 test routing/plan task 字段；不建 runtime | build-plan → build-code test executor | test routing 已原生表达能力与时限 |
| closure manifest / late member | existing review packet manifest + broker group/provider output; no new store | review route/broker → canonical writer | review packet/result natively preserve equivalent bytes and correlation |
| bounded completion event | host lifecycle event, transient; terminal ref points to existing evidence | host runtime → main session | host supplies equivalent terminal notification |
| sanitized diagnostic | existing attempt error.diagnostic | review route → user/status projection | canonical attempt schema provides typed equivalent |
| AC freshness | 既有 acceptance evidence/projection；不建 AC store | evidence writer → completion projection | current projection 原生采用同一白名单 |
| route repair budget | 既有 review budget context + canonical attempt history；不建新 store | review route/budget validator → review dispatch | 既有预算原生支持同等严格的受认证修复判定 |

Worker summary 按 UTF-8 Unicode 字符数计正文不超过 500；`sha256` 是 ref 所指 immutable UTF-8 bytes 的 SHA-256，ref 必须在 task quality namespace 可读且回读 hash 相同。主会话操作事实按宿主 lifecycle 分类：interaction/dispatch/integration/adjudication 合法；全仓扫描、测试命令和独立 review provider 执行若由 main-session producer 发起，现有 stage pre-dispatch/lifecycle validator 必须拒绝该派发并记录 ROLE_BOUNDARY_VIOLATION；AC-COORD-002 逐事件核对 producer role，不能只做事后 token 观察。

### 指标口径

主会话 token 占比窗口从 build-code 开始到 verify-code 结束；分母为 root 与全部直系 worker 的 input tokens 之和，按宿主原始 usage 计数且同一缓存重发仍按报告值一次计入，不含 provider 内部 token；分子仅 root input tokens。任一 usage 缺失则指标 unavailable，AC-COORD-001 不通过。meaningful event 只计 dispatch、一次显式 intervention/adjudication、terminal collect 三类主会话事件；自动完成通知不计，主动 sleep 或重复 status 每次均计违规。

### 测试运行画像权限矩阵

| profile | duration ceiling | network/DB | filesystem/subprocess | environment |
| --- | --- | --- | --- | --- |
| inner | 60s | 禁止 | 禁止 | local/CI |
| medium | 300s | 仅显式 localhost；DB 仅 localhost fixture | 仅任务 worktree/临时目录与显式子进程 | local/CI |
| large | 必须逐项声明，缺失即 invalid | 必须逐项声明，unknown=deny | 必须逐项声明，unknown=deny | CI only |

本期交付机器可读声明与合同校验；不新建通用隔离 sandbox。负向合同测试证明禁止项、unknown 权限和 large 非 CI 被拒；真实能力隔离若现有 executor 不能证明，事实保持 unavailable，不宣称 enforcement。

### ADR 0025 精确修订

仅修订两处：把 ADR 0007 的“packet-plan 不设 byte/token/time/output/file 上限”改为“packet-plan 可声明 dispatch 前输入/上下文上限并在超界时拒绝本次 provider 调用；该事实不参与阶段、质量或发布放行”；把 standard-workflow 的“不设统一预算 gate”改为“时间/token 继续作为诊断；审查入口可使用已批准的 dispatch 前边界避免必败昂贵调用，但不得成为统一预算 gate”。ADR 0007 的 runtime-owned public status polling 保持不变。任何第三处治理语义变化均失败。

## 6. 模块划分

### 审查生命周期
- **负责什么**：从冻结请求到 managed run、状态恢复、终态发布与 drift 分类。
- **对外提供什么**：可定位 attempt/result、稳定状态与错误。
- **依赖谁**：既有审查入口和 broker managed lifecycle。
- **测试边界**：SCN-001～SCN-005 可分别验收。

### 阶段协调
- **负责什么**：创建自足 worker brief、限制读并发、保持单写者、接收窄返回。
- **对外提供什么**：小上下文主会话和可认证执行引用。
- **依赖谁**：现有阶段 packet、stage outcome 和宿主子代理能力。
- **测试边界**：SCN-006、SCN-007、SCN-010。

### 完成事实投影
- **负责什么**：测试画像声明与逐 AC 新鲜度判断。
- **对外提供什么**：诚实分类、stale 原因与 provenance。
- **依赖谁**：当前四材料和已有质量 evidence。
- **测试边界**：SCN-008、SCN-009。

## 7. 关键实体

- **Review request identity**：由任务、阶段、review track、冻结材料 identity、provider 选择与有效配置共同决定；runtime 元数据和时间不参与。
- **Review attempt**：记录 dispatch state、错误、provider 成员、runtime identity 和终态；immutable、create-only。
- **Worker brief**：包含任务/阶段 identity、材料 revision、snapshot、source digests、任务目标、边界、允许工具与期望输出。
- **Worker summary**：只含 conclusion、ref、sha256，正文不超过 500 字。
- **Test runtime profile**：inner、medium、large 之一，以及时长与能力许可。
- **AC completion fact**：包含 task、AC ID、结果、snapshot tree、material revision、证据 identity 与 provenance。

## 8. 数据和生命周期

- **数据粒度**：每个 review request/runtime/attempt、worker brief/summary、test profile 和 AC result 各自一条身份。
- **数据时效**：request/runtime 运行中可查询；canonical attempt/result 和 evidence create-only；AC 复用每次重新校验。
- **缺失或迟到**：缺可信 token/health 记 unknown；broker 未终态只返回运行态；缺 evidence 不产生 pass。
- **预览与正式**：broker 状态是运行事实；只有现有 canonical writer 的终态记录是正式审查事实。
- **当前与历史**：新请求 identity 决定当前性；旧 immutable 记录保留审计，不扫描 latest 冒充当前。
- **归属与清理**：复用既有 task quality namespace 和 broker lifecycle；本期不新增 store 或清理协议。

## 9. 兼容性预留

- **既有消费方**：同步 run、现有 attempt/result schema、stage outcome 与质量投影继续可读；managed lifecycle 在适配边界归一，不要求消费者理解 broker 内部结构。
- **命名预留**：保留 test tier；新增名称仅为 test runtime profile；主角色称 main session 或 stage coordination。
- **容器预留**：在现有 packet、attempt、result 与 quality evidence 中扩展必要字段，不建平行容器。
- **状态预留**：未知保持 unknown；不可用保持 unavailable；不新增第五种 finding disposition。
- **扩展边界**：后续 S3～S7 可消费本期事实，但不得在本期提前实现。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新增第六 stage、质量/发布 gate、第二 store、双写、第五材料或永久 compatibility bridge（D-003）。
- 不改 broker 内部 provider 协议，只消费既有 managed lifecycle（D-001、D-003）。
- 不实现 S3 fixture/并行度提速、S4 切片预算闭合、S5 repair delta/resolved、S6 phase loop 瘦身、S7 close 表达（D-010）。
- 不改 close 授权语义，不执行 commit、push、merge、archive 或 cleanup。
- 不将 unavailable、unknown、incomplete 或空 findings 写成通过。
- 不把测试画像合同宣称为已经获得性能收益。
- 不把 route repair 扩展为 replacement review、reopen、通用 recovery/continuation 或无限重试。

### 默认必须成立

- 所有正式结果保留来源、hash、task/stage/material/snapshot identity；关联 FR-REVIEW-004、FR-COORD-002、FR-FRESH-001。
- 质量事实只描述质量与完成，不成为工作许可证；关联全部 FR/AC。
- read parallel、write serial，独立审查不得由作者自审替代；关联 FR-COORD-001～003。
- 新控制面若不可避免，必须登记唯一 owner、真实 consumer、测试和删除条件；本期优先扩展既有能力。

## 11. 验收标准

- [ ] **AC-REVIEW-000**：生命周期、分类与原子边界矩阵
场景：逐项执行 preflight blocked、start success 后中断、running、clean 空 findings、partial、cancelled、status unreadable、expired、missing、material drift，以及 start 前/最后成员后/publication 临界区三处材料 mutation。
验证：每个 case 检查唯一 owner/container、typed code、provider 调用数、runtime/request 复用、closure bytes/hash 和当前投影。
通过：所有 case 精确落到本规格矩阵；clean 空 findings 只形成 clean 候选事实而非 stage pass；三处 mutation 均不发布 stale current result；start 成功后中断可用同 request 幂等找回 runtime。
失败：任一状态被折叠为 clean/pass、重复 provider、丢失成员、错误码不可区分、closure 比较与发布间可插入 stale 写，或 fixture 代替真实复跑。
证据：table-driven integration tests + canonical attempt/result evidence。

- [ ] **AC-REVIEW-001**：静态必败在昂贵派发前结束
场景：SCN-001 中任一可预知无效输入发起审查。
验证：观察耗时、dispatch state、provider attempts 和诊断。
通过：五秒内返回 blocked_before_dispatch，provider 调用数和 provider attempts 均为 0，并有稳定错误码与下一步。
失败：超过五秒、启动任一 provider、只抛无记录异常，或把阻断记成 pass。
证据：test + canonical attempt evidence。

- [ ] **AC-REVIEW-002**：未知健康和 token 上限不被猜成失败或通过
场景：SCN-002 中静态字节合法但可信 limit/health 缺失。
验证：观察边界判定和后续运行事实。
通过：未知显式记录，既不直接拒绝也不声称健康；继续使用可信字节边界。
失败：用字符代理冒充 token、把 unknown 当 unhealthy，或把未知改写为 pass。
证据：contract test + attempt evidence。

- [ ] **AC-REVIEW-003**：中断后复用 managed run
场景：SCN-003 中至少一个 provider 已完成后调用方中断并恢复。
验证：比较恢复前后 request/runtime identity、provider 成员和最终 canonical result。
通过：同一 request identity 返回同一未过期 runtime，至少复用一个已完成成员，终态结果只发布一次。
失败：重新调用所有 provider、丢失已完成成员、产生冲突终态，或扫描历史 latest 猜结果。
证据：integration test + broker status/result evidence。

- [ ] **AC-REVIEW-004**：非材料写入不造成漂移
场景：SCN-004 在 dispatch 期间产生闭包外写入。
验证：比较冻结材料 identity 与最终 result binding。
通过：drift 数为 0，结果正常记录且身份仍匹配。
失败：因闭包外文件变化返回 REVIEW_SOURCE_DRIFT 或丢弃结果。
证据：integration test + canonical review result。

- [ ] **AC-REVIEW-005**：材料漂移留下真实 attempt 并保留成员事实
场景：SCN-005 在 dispatch 期间改变受审材料。
验证：观察 attempt、成员输出和当前结果投影。
通过：写一个 unavailable attempt，明确 drift；已完成成员仍可定位；旧结果不冒充当前。
失败：没有 attempt、删除成员事实、绑定 stale result，或把 drift 当 clean。
证据：integration test + attempt/provider evidence。

- [ ] **AC-REVIEW-006**：受认证 route repair 只增加一次真实失败重试预算
场景：SCN-011 的合格路径，以及零 provider attempt、blocked-before-dispatch、非 provider 错误、部分/成功 semantic output、route identity 未变化、调用方伪造 repair 字段和第二次 route repair 负例。
验证：比较 canonical prior attempt、宿主当前 route identity、budget kind/count 与 dispatch 决策。
通过：只有合格路径得到 `kind=route_repair` 且同 revision 一次；所有已消耗真实 round 的不合格负例在 provider 调用前 fail closed，原 unavailable/failed facts 不被改写；blocked-before-dispatch 仍按既有 initial 语义处理但不得标成 route repair。
失败：任一 request 自报即可放行、非真实 provider failure 被重派、同 route 重派、同 revision 第二次重派，或旧失败事实被覆盖。
证据：`tests/review/review-record-route.test.mjs` table-driven contract + canonical attempt history fixture。

- [ ] **AC-COORD-001**：主会话输入占比下降
场景：SCN-010 完整复跑。
验证：以该任务全部输入 token 为分母、main session 输入 token 为分子。
通过：占比低于 25%；无法采集时只记录 unavailable，不宣称达标。
失败：占比不低于 25% 或分母不完整却报告通过。
证据：performance profile evidence。

- [ ] **AC-COORD-002**：worker brief 和窄返回全部合规
场景：SCN-006 中所有 worker 派发。
验证：逐个检查 brief identity/边界和 summary 长度/ref/hash。
通过：100% brief 自足，100% 返回不超过 500 字且含可读 ref 与匹配 sha256。
失败：任一 worker 继承未声明历史、返回轨迹、超长或 ref/hash 不匹配。
证据：contract test + worker lifecycle evidence。

- [ ] **AC-COORD-003**：读并发受限且写单线程
场景：SCN-007 同时安排独立读取与写入。
验证：观察并发峰值、依赖图与写 owner。
通过：默认读并发不超过 3、任何 phase 的 worker 总数和并发峰值均不超过 6；第 7 个请求未派发且返回重新切分；同时写 owner 始终为 1。
失败：超过硬上限、多 writer，或有依赖任务并行写。
证据：contract/integration test + stage outcome evidence。

- [ ] **AC-COORD-004**：长任务无 sleep polling
场景：SCN-010 含一个长运行任务。
验证：统计 main session 从派发到终态的有意义事件及 sleep/poll 调用。
通过：有意义主会话事件不超过 3 且 sleep polling 为 0。
失败：循环 sleep、重复 status 回传淹没主会话，或超过 3 个无必要事件。
证据：performance profile evidence。

- [ ] **AC-TEST-001**：测试画像与 tier 正交且字段完整
场景：SCN-008 检查本任务计划内每个测试。
验证：逐项核对 tier、profile、时长、五类能力/环境声明及 executor 的 capability proof/拒绝事实。
通过：每项同时具有独立 tier/profile；executor 对每项禁用能力给出可认证 enforcement/deny 事实，无法证明时该项 unavailable 且 AC 不通过；inner、medium、large 均遵守本规格边界。
失败：复用 test tier 名称表示时长、字段缺失，或把 unknown 权限视为允许。
证据：contract test + plan analysis evidence。

- [ ] **AC-TEST-002**：性能画像不改变测试行为
场景：对一个受影响测试集合生成本期唯一性能画像。
验证：比较画像前后测试选择、断言语义和结果。
通过：选择与断言不变，记录时长/profile/权限事实；不包含 fixture 或并行度改造。
失败：为达时长删除测试、弱化断言，或声称未实施的提速。
证据：performance profile + targeted test evidence。

- [ ] **AC-FRESH-001**：仅 material revision 变化可复用
场景：SCN-009 中只改变 material revision，其他绑定完全相同。
验证：比较 AC fact 的全部 identity/result/evidence 字段与 provenance。
通过：AC 仍可作为当前结果消费，并保留 source material revision。
失败：拒绝唯一允许的差异，或丢失来源 revision。
证据：contract test + acceptance projection evidence。

- [ ] **AC-FRESH-002**：其他任何差异都必须 stale
场景：分别改变 task、snapshot tree、evidence ref、evidence hash、AC ID、适用输入、结果或来源 provenance（除目标 current material revision 外）。
验证：逐例读取新鲜度结论和原因。
通过：每例均 stale/incomplete 且指出实际变化字段。
失败：任一变化仍复用，或把 stale 改写为 passed。
证据：negative contract tests + projection evidence。

- [ ] **AC-DELIVERY-001**：当前 task 本地 aggregate 覆盖四类行为并保留 live 缺失边界
场景：SCN-010 读取当前认证 task 的 targeted receipts、源码和四份材料；不要求用户提供真实 task。
验证：汇总 AC-REVIEW、AC-COORD、AC-FRESH 和 profile 证据，并检查每个 active AC 有实际 assertion；对没有 host telemetry 的 AC-COORD-001/004 输出 `unavailable` 及原因。
通过：本地合同和逐 AC 绑定均可判真，缺失的真实 task/host usage 明确保留为 unavailable，不把本地 aggregate 当真实运行或统计结论。
失败：遗漏 active AC、读取过期/非零 targeted receipt、伪造 usage，或把 unavailable 写成 live threshold 达标。
证据：current-task aggregate JSON、targeted test receipts 与当前源码/材料身份。

## 12. 风险、未决与交接

- **RISK-001**：S1+S2 同任务仍可能过大。
  - **受影响 ID**：全部 FR、AC-DELIVERY-001。
  - **触发条件**：单张卡生产文件超过 10，或一个 phase 混入多个独立 seam/三个工作流；这些只作为 build-plan 的 advisory 风险指标，不是质量、阶段或发布 gate。目标不超过 5 个生产文件同样只是优化目标。
  - **后果**：再次出现长任务、慢反馈和上下文腐烂。
  - **缓解**：build-plan 显示 seam、工作流混合和文件数量风险并建议拆分，但不拒卡、不自动 STOP；是否拆分由用户按现有确认边界裁定。
  - **处理 Stage**：build-plan。
  - **验证**：文件边界与依赖图检查。
- **RISK-002**：审查生命周期接线错误会重复 provider 或丢结果。
  - **受影响 ID**：FR-REVIEW-002、AC-REVIEW-003～005。
  - **触发条件**：request identity 不稳定、runtime identity 未立即保存或终态双写。
  - **后果**：昂贵调用重复、canonical 冲突或不可恢复。
  - **缓解或 STOP**：幂等和中断场景先以负向测试证明；冲突即停止发布。
  - **处理 Stage**：build-code。
  - **验证**：integration test 与 create-only result。
- **RISK-003**：dispatch 前置被误用为 release gate。
  - **受影响 ID**：FR-REVIEW-001、FR-REVIEW-004、AC-REVIEW-001。
  - **触发条件**：实现把 blocked_before_dispatch 用作阶段是否可修复的许可。
  - **后果**：违反质量事实非许可证原则。
  - **缓解或 STOP**：ADR 0025 明确只允许拒绝本次昂贵调用；同 task 修复继续。
  - **处理 Stage**：build-spec、build-code。
  - **验证**：治理合同检查。
- **RISK-004**：逐 AC 容忍被扩大为 broad stale bypass。
  - **受影响 ID**：FR-FRESH-001、AC-FRESH-001～002。
  - **触发条件**：比较逻辑忽略 snapshot 或 evidence/result。
  - **后果**：旧事实冒充当前通过。
  - **缓解或 STOP**：比较中的 `source_material_revision` 与全部 provenance 保持原值，允许的是目标 current material revision 与 source_material_revision 不同；任一其他字段差异 fail closed。
  - **处理 Stage**：build-code、verify-code。
  - **验证**：逐字段 mutation tests。

- **OPEN-001**：真实任务/host telemetry 后续 evidence。
  - **受影响 ID**：AC-COORD-001、AC-COORD-004、AC-DELIVERY-001 的 live threshold 分支。
  - **owner**：用户/host instrumentation。
  - **影响**：不影响本次 local-contract verification；live ratio、polling 和真实 n=1 仍不可宣称。
  - **处理 Stage**：后续 build-code/verify-code evidence。
  - **关闭条件或 STOP**：另一次认证复跑提供 task identity、host usage、四场景原始结果，并逐项回读；本次不创建 fixture 或合成 usage。

### 延期交接

- **DEFER-S3**：测试 fixture、并行度和内容复用实际提速；owner=测试基础设施；触发=画像合同落地；关闭=p95 inner≤120s、phase≤300s 的真实证据。
- **DEFER-S4**：切片上限、预算唯一 owner 与旁路关闭；owner=build-plan/review route；触发=下一真实计划需可执行拦截；关闭=超限卡拒绝且旁路不可绕过。
- **DEFER-S5**：repair delta 与 resolved 链；owner=review/evidence；触发=S1 结果耐久完成；关闭=窄修复无需 full review 得到 resolved。
- **DEFER-S6**：phase loop 与 RED/GREEN evidence 瘦身；owner=build-code workflow；触发=S1 完成；关闭=数量与耗时画像下降且语义不弱化。
- **DEFER-S7**：verify/close read model 表达；owner=close/evidence；触发=下一次真实 close；关闭=合同测试与一次 close 读回。

## 13. 业务影响与回归范围

### 审查执行
- **既有行为**：同步等待；任意 source 漂移可能丢整次结果。
- **本需求影响**：派发前快速失败、managed 恢复、材料闭包 drift。
- **回归路径**：静态阻断、正常完成、部分失败、取消、中断恢复、材料/非材料变化。
- **验收**：AC-REVIEW-000～005。

### 阶段协调
- **既有行为**：主会话可承载重读、轮询和大返回。
- **本需求影响**：四职责、窄 brief/return、读并行写串行。
- **回归路径**：小任务、长任务、并发只读、串行写、worker 不可用。
- **验收**：AC-COORD-001～004。

### 完成事实
- **既有行为**：test tier 不表达运行权限；逐 AC revision 变化会与其他 stale 条件混合。
- **本需求影响**：正交 profile 与窄 material revision 容忍。
- **回归路径**：三个 profile；逐字段新鲜度正反例。
- **验收**：AC-TEST-001～002、AC-FRESH-001～002。

- **可能受冲击的业务规则**：review identity 幂等、immutable publication、stage completion 诚实性、测试断言不弱化。
- **明确无影响**：任何 UI/页面、broker 内部 provider 协议、close 授权语义、S3～S7 延期能力。
