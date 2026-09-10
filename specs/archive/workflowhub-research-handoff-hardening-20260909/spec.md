# 功能规格：WorkflowHub 调研、阶段状态、自动复盘与交接加固

- **功能名**：WorkflowHub 调研与阶段交接加固
- **来源**：当前 `decision-log.md` R-001～R-024、D-001～D-013（含 2026-09-10 增量修订模块 F）、`acceptance-draft.md` 的九条上游验收项，以及本阶段真实 `spec-clarify` 答复
- **状态**：规格正文已通过独立内容复核与定向校验；2026-09-10 增量修订已并入（R-021～R-024）；正式 review 因 `REVIEW_RETRY_BUDGET_UNKNOWN` 保持 `unavailable`，认证 stage outcome 尚缺
- **内容合同**：`spec-content.v3`
- **UI applicability**：`non_ui`
- **冻结输入**：`stage-input-packet.v1`（2026-09-09 冻结，`packet_freeze_hash=bbec6d4bcf3c03cd30bab1d9ad48a8ad667a4ead58eebb95afdfe91ce54747d0`）；2026-09-10 增量修订后四材料已变化，旧 hash 只作历史；当前冻结由 stage outcome 按最终材料字节记录，hash 不写回材料以避免内容寻址自引用。

## 材料导航

| 章节 | 摘要 | 建议读取时机 |
| --- | --- | --- |
| 速读卡 | 目标、影响面与验收信号 | M/S |
| 来源与澄清 | R→D→FR/AC 及本阶段用户答复 | S/B/P |
| 场景与状态 | 正常、空、失败、等待、权限和竞态 | S/B |
| 产品事实 | 已核实事实、推断、未知与不适用 | S/B |
| 功能需求 | 用户和下游必须观察到的行为 | S/B/P |
| 实体与生命周期 | 状态、绑定、覆盖与不可变边界 | B/P |
| 非目标 | 本任务唯一权威排除范围 | M/S/B/P |
| 验收标准 | 十三项可判真 oracle 与失败条件 | S/B/P |
| 风险与交接 | OPEN/RISK/DEFER 的 owner 和关闭条件 | S/B/P |

M=make-decision 回看；S=build-spec；B=build-plan/build-code；P=verify-code。

## 速读卡（30 秒）

- **一句话需求**：让 WorkflowHub 的外部调研可核验且有经批准的兜底，合法 stage 重试不再产生假阻塞，五个正式 stage 自动复盘，四个作者 stage 自动留下可复制路径的交接包；并修掉已复现的 UI 判定、review 预算归域、性能放大与 verify 发布缺口。
- **核心改动点**：research 三态机器事实；execution facts 与质量谓词分离；review 投影同源与预算归域；控制面逐项清理并补齐 verify 发布与根因归并；reflection 与 handoff 自动执行且互相隔离；UI 判定与性能按结构化契约处理。
- **最大影响面**：make-decision 调研、stage 状态读取、build-code review 状态、四个作者 stage 的结束行为，以及 UI 判定、review 预算与官方验收耗时。
- **验收信号**：十三项 AC 均可由真实运行、当前绑定的文件或针对性行为证据判定；不新增推进门。

## 来源与决策映射

| Source | Decision | FR | AC | Status / affected scope |
| --- | --- | --- | --- | --- |
| R-001 | D-001/D-002/D-003 | FR-RESEARCH-001、FR-RESEARCH-002、FR-RESEARCH-003、FR-RESEARCH-004 | AC-RESEARCH-001、AC-RESEARCH-002、AC-RESEARCH-003 | current；调研深度、失败与兜底 |
| R-002 | D-003 | FR-RESEARCH-003、FR-RESEARCH-004 | AC-RESEARCH-003 | current；外部检索兜底 |
| R-003 | D-009 | FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004 | AC-HANDOFF-001 | current；交接信息完整度 |
| R-004 | D-009 | FR-HANDOFF-001 | AC-HANDOFF-001 | current；仓内新技能 |
| R-005 | D-009 | FR-HANDOFF-001 | AC-HANDOFF-001 | current；stage 末自动调用 |
| R-006 | D-009 | FR-HANDOFF-002 | AC-HANDOFF-001 | current；taskPath 产物 |
| R-007 | D-009 | FR-HANDOFF-004 | AC-HANDOFF-001 | current；绝对路径通告 |
| R-008 | 过程约束 | 全部 FR 的阶段执行顺序 | 全部 AC 的阶段事实 | current；不伪造产品 FR |
| R-009 | T3-Q7=A | 全部 FR | 全部 AC | current；方向不得留给 build-spec 补写 |
| R-010 | D-001～D-009 | 全部 FR | 全部 AC | current；流程、表面、状态、边界、非目标、延期 |
| R-011 | 过程约束 | N/A | 子代理执行事实 | current；主上下文与委派纪律 |
| R-012 | 过程约束 | N/A | 已完成交互事实 | current；Talk/Grill 表达纪律 |
| R-013 | D-004/D-005 | FR-EXECUTION-001、FR-EXECUTION-002、FR-EXECUTION-003、FR-EXECUTION-004 | AC-EXECUTION-001、AC-EXECUTION-002 | current；合法重试和假 missing |
| R-014 | D-001～D-009 | 全部 FR | 全部 AC | current；Talk R1 选择 |
| R-015 | D-001～D-009 | 全部 FR | 全部 AC | current；Talk R2 选择 |
| R-016 | D-007 | FR-GOVERNANCE-001、FR-GOVERNANCE-002、FR-GOVERNANCE-003、FR-GOVERNANCE-004、FR-GOVERNANCE-005 | AC-GOVERNANCE-001 | current；控制面治理 |
| R-017 | D-006 | FR-REVIEW-001、FR-REVIEW-002 | AC-REVIEW-001 | current；build-code review 投影 |
| R-018 | D-004～D-008 | FR-EXECUTION/REVIEW/GOVERNANCE/REFLECTION | 对应四域 AC | current；Talk R3 选择 |
| R-019 | D-009 | FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004 | AC-HANDOFF-001 | current；Grill 选择 |
| R-020 | D-009 | FR-HANDOFF-004 | AC-HANDOFF-001 | current；完整路径硬要求 |
| R-021 | D-010 | FR-MATERIAL-001、FR-MATERIAL-002 | AC-MATERIAL-001 | current；UI 判定 producer 契约与 packet readiness |
| R-022 | D-011 | FR-REVIEW-003 | AC-REVIEW-002 | current；review 预算历史按 namespace 归域 |
| R-023 | D-012 | FR-PERFORMANCE-001、FR-PERFORMANCE-002 | AC-PERFORMANCE-001 | current；性能预算与重复身份校验放大 |
| R-024 | D-013 | FR-GOVERNANCE-006、FR-GOVERNANCE-007 | AC-GOVERNANCE-002 | current；verify 唯一 publisher 与 gap 根因归并 |

### 规格澄清

`spec-clarify` 在本阶段触发一次，共两个互相独立的问题。用户真实回复原文为 `` `1A 2`B ``，按语义明确解释为 `1A 2B`；没有剩余方向性问题。

- **Clarify 生命周期声明**：`spec-clarify trigger=true`；reason=两个实现参数会改变执行冲突和 handoff 持久化语义；`open_direction_changing_questions: 0`。

- **选择 1A**：同一当前绑定下，不同成功执行的语义结果互相矛盾时，public `execution_outcome.status=failed`，诊断原因明确为结果内容冲突，所有需要唯一当前结果的消费者 fail-loud，不静默选择 winner。
- **选择 2B**：`stage-handoff` 只保留固定 `<stage>.md`，每次成功生成时原子覆盖，不保存历史版本。
- **来源状态**：`source=user_reply`；答复已进入本次冻结输入包。

- **2026-09-10 增量修订**：`spec-clarify trigger=false`；reason=本次增量由 decision-log 模块 F（R-021～R-024 / D-010～D-013）直接给出方向与失败边界，没有会改变产品行为的规格歧义；剩余项是字段名、分类键、预算数值与实现点等实现参数，owner 分别为 build-spec（OPEN-013/OPEN-014）与 build-plan（OPEN-015/OPEN-016）。`open_direction_changing_questions: 0`。

## 1. 问题与紧迫性

当前外部调研可能只有自由文本或被错误塞进测试回执，anysearch 的失败原因、重试和兜底不可稳定观察；合法的多次 stage 执行会被数量误判为冲突，再被投影为不存在的 `stage_outcome` 缺口；review、reflection 和 handoff 又存在生产者、消费者或结束时机不一致。结果是用户看见很多“阻塞”，却分不清真质量缺口、外部执行不可用和 WorkflowHub 自身的投影错误。

本期必须把这些状态分开：真实结构错误 fail-loud；质量与辅助事实如实记录；四材料继续决定能否工作；完成结论仍需真实质量事实。控制面只保留有真实消费者和退出条件的部分。

## 2. 背景、目标与范围

### 背景

make-decision 已收敛十三项决定（D-001～D-013，含 2026-09-10 增量模块 F）。本任务不重新选择方向，只把 research、execution outcome、review、治理、reflection、handoff、UI 判定、性能预算与 verify 发布的用户可观察行为定成可实现、可验收的合同。现有 research R5 复核已执行并落盘，但覆盖为 `partial`，不能被描述为研究通过。

### 目标

- 调研需要执行时可复核；无需执行或无法执行时也有机器事实，且不成为推进门。
- 合法重试不再产生假 conflict/missing；真实语义冲突公开失败。
- build-code 的 review 谓词保持严格，同时两处投影来自同一事实。
- 控制面逐项可审计，死门、静默失效和重复派生按证据处置。
- 五个正式 stage 自动执行 reflection；四个作者 stage 随后生成当前 handoff。

### 范围内

七类既有公共命令的状态 JSON、阶段末大白话摘要，以及 research、reflection、stage outcome、review 和 stage-handoff 文件产物。页面范围为无 UI；CLI 输出和文件是本任务的交互表面。

## 3. 用户场景与状态覆盖

### SCN-001：需要调研且首选工具成功

- **角色**：make-decision 主会话。
- **Given**：存在会改变方向的外部事实问题。
- **When**：首选检索和原文读取成功。
- **Then**：生成当前绑定、内容寻址的 `completed` research fact，摘要显示覆盖和待补项。

### SCN-002：现有事实已足够

- **角色**：make-decision 主会话。
- **Given**：没有外部答案会改变当前方向。
- **When**：调研被合法跳过。
- **Then**：生成 `skipped` fact，写明问题、不会改变方向的理由和依据事实。

### SCN-003：首次失败后重试成功

- **角色**：make-decision 主会话。
- **Given**：首选检索出现可重试故障。
- **When**：同一路由执行唯一一次重试并成功。
- **Then**：保留两次 attempt 的状态和耗时，不请求降级批准。

### SCN-004：等待降级批准

- **角色**：用户与主会话。
- **Given**：首选路由无法继续。
- **When**：主会话向用户请求一次降级批准但尚未答复。
- **Then**：research 为 `unavailable/awaiting_user_approval`；其它不依赖检索的工作继续。

### SCN-005：批准后使用兜底

- **角色**：用户与主会话。
- **Given**：用户真实批准降级。
- **When**：宿主搜索和原文读取能力完成检索。
- **Then**：写新的 `completed` fact，保留兜底来源；不覆盖之前的 unavailable fact。

### SCN-006：用户拒绝降级

- **角色**：用户与主会话。
- **Given**：兜底批准已请求。
- **When**：用户拒绝。
- **Then**：research 为 `unavailable/declined`，摘要保留待补问题。

### SCN-007：多个等价成功执行

- **角色**：状态读取者。
- **Given**：同一当前身份下有多个已认证成功执行。
- **When**：它们的语义签名相同。
- **Then**：公开 `completed`，如实显示数量，不排序、不选择 winner。

### SCN-008：同一 `attempt_id` 异字节重放

- **角色**：正式写入边界。
- **Given**：同一 `attempt_id` 已有不可变原件。
- **When**：同一 attempt 再提交不同 canonical bytes。
- **Then**：写入明确拒绝并 fail-loud，旧原件不变。

### SCN-009：不同执行的语义结果矛盾

- **角色**：状态读取者和需要唯一结果的消费者。
- **Given**：同一当前身份下有多个已认证成功执行。
- **When**：派生出的语义签名不一致。
- **Then**：按用户选择公开 `failed`，诊断为结果内容冲突，消费者不得自行挑选结果。

### SCN-010：没有当前 outcome

- **角色**：状态读取者。
- **Given**：当前 snapshot/material 没有已认证 outcome。
- **When**：读取 status。
- **Then**：`execution_outcome=unavailable`，不进入 `missing`、`predicates` 或 `quality_status`。

### SCN-011：同毫秒终态无法定序

- **角色**：状态读取者。
- **Given**：两个终态时间相同且内容不能证明等价。
- **When**：系统无法确定次序。
- **Then**：公开 `failed`，内部诊断标记 `ambiguous`；不隐式使用数组或路径顺序。

### SCN-012：review 已正式记录

- **角色**：build-code 完成状态读取者。
- **Given**：当前 review 生命周期完成并绑定 canonical result。
- **When**：生成 envelope 与 integration review fact。
- **Then**：两处引用同一 ref/hash，均显示 recorded/completed。

### SCN-013：review 不可用或缺失

- **角色**：build-code 修复者。
- **Given**：provider 不可用、生命周期未完成或 receipt 缺失。
- **When**：读取完成状态。
- **Then**：provider unavailable 时两处均为 unavailable 且同 reason/provenance；receipt 或 lifecycle missing 时 fact 为 missing、skill row 为 `unavailable/session_lifecycle_event_unavailable`；两支都不满足谓词且不产生假完成。

### SCN-014：控制面逐项处置

- **角色**：维护者和审查者。
- **Given**：已生成逐对象控制面清单。
- **When**：核对生产者、消费者、owner、影响与退出条件。
- **Then**：每项得到 retain/repair/delete/defer 结论并按结论落地。

### SCN-015：自动复盘成功

- **角色**：任一正式 stage 主会话。
- **Given**：stage 结束且生产 executor 可用。
- **When**：唯一 stage-end hook 执行。
- **Then**：reflection 记录真实 executor、attempt、输出 hash 和当前绑定。

### SCN-016：自动复盘失败

- **角色**：任一正式 stage 主会话。
- **Given**：executor 已调用但超时或失败。
- **When**：hook 收口。
- **Then**：记录真实 failed/unavailable，保留原 stage 结果且不阻断。

### SCN-017：作者阶段生成 handoff

- **角色**：用户与下一会话。
- **Given**：四个作者 stage 之一结束。
- **When**：reflection 已到终态。
- **Then**：同一 hook 随后生成固定路径的 13 区块 handoff，并通告绝对路径。

### SCN-018：同一 stage 重跑

- **角色**：下一会话。
- **Given**：固定 handoff 已存在。
- **When**：当前 stage 产生新 handoff。
- **Then**：按用户选择原子覆盖固定文件，不保存旧版本；新文件绑定当前身份。

### SCN-019：reflection 不可用

- **角色**：用户与下一会话。
- **Given**：reflection 终态为 unavailable。
- **When**：hook 继续执行 handoff。
- **Then**：handoff 仍被尝试，成功文件明确标注 reflection 不可用。

### SCN-020：handoff 写入失败

- **角色**：当前用户。
- **Given**：固定目标可能已有旧文件。
- **When**：当前写入、同步、替换或回读失败。
- **Then**：本次状态为 unavailable，通告原因、预期绝对路径和“旧文件可能陈旧”；不得把旧文件宣称为当前。

### SCN-021：新会话手工续接

- **角色**：用户和下一会话。
- **Given**：用户复制阶段末路径。
- **When**：新会话读取 handoff。
- **Then**：读到任务身份、结论、进度、风险和唯一下一动作，再回读四份正式材料。

### SCN-022：结构化 UI 判定重算通过

- **角色**：make-decision / build-spec。
- **Given**：三个输入来源都是带显式结论 `non_ui` 的结构化事实。
- **When**：按同一三输入规则重算 UI applicability。
- **Then**：顶层结果与派生结果都为 `non_ui`，写入与读取校验均无冲突。

### SCN-023：UI 声明与来源结论冲突

- **角色**：make-decision / build-spec。
- **Given**：顶层声明 `non_ui`，但某个来源事实的结论是 `ui`。
- **When**：写入当下执行与 reader 相同的校验。
- **Then**：写入 fail-loud 并指出冲突来源；不落盘自相矛盾的事实。

### SCN-024：UI 来源缺失或未知

- **角色**：make-decision / build-spec。
- **Given**：三个来源之一缺失，或其结论为 `unknown`。
- **When**：重算 applicability。
- **Then**：结果保持 `unknown` 并带原因与 handoff；不得默认填 `non_ui`。

### SCN-025：无关历史损坏下的当前 review

- **角色**：工头 / Stage Agent。
- **Given**：预算历史中存在可证明属于其它 stage、track、kind、phase 或 subject 的坏记录。
- **When**：发起当前 review 请求。
- **Then**：坏记录原字节保留并披露 integrity unavailable；当前请求恰好 dispatch 一次，不被无关历史阻断。

### SCN-026：当前身份损坏或不可归域损坏

- **角色**：工头 / Stage Agent。
- **Given**：坏记录与当前请求身份完全相同，或损坏严重到无法归域。
- **When**：读取预算历史。
- **Then**：零 dispatch；前者报 `REVIEW_RECORD_INCOMPLETE` 并指出损坏引用，后者保持 `REVIEW_RETRY_BUDGET_UNKNOWN`，不猜预算。

### SCN-027：重复 authenticated 操作与 official fixture 的性能预算

- **角色**：build-code / verify-code。
- **Given**：同一 authenticated operation 内多次读取 workspace identity，或完整 official fixture 被重复执行。
- **When**：按性能预算执行。
- **Then**：单次 operation 内复用已校验身份、完整 fixture 共享一次；wall-time 与 spawn 次数落在登记预算内，身份变化时仍 fail-loud。

### SCN-028：verify 摘要经唯一 writer 发布

- **角色**：verify-code。
- **Given**：一次真实 verify 运行产生逐 AC 结果。
- **When**：发布 verify 摘要。
- **Then**：摘要经唯一 writer 写入并立即可读；不存在能绕过该 writer 写入 canonical task root 的第二写入者。

### SCN-029：同一根因的多条 gap 归并展示

- **角色**：用户 / 工头。
- **Given**：一个上游缺口同时出现在 quality、release 和 close 投影中。
- **When**：读取 public status。
- **Then**：默认按根因归并显示一次，并可展开派生视图；不把同一根因报成多个独立阻塞。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-007、SCN-015、SCN-017。
- [x] **空态**：SCN-002、SCN-010。
- [x] **错误态**：SCN-006、SCN-008/SCN-009/SCN-011、SCN-016、SCN-020、SCN-023、SCN-026、SCN-028。
- [x] **加载态**：N/A — 无持续 UI；同步工具调用只发布已知终态，等待用户单列为权限态。
- [x] **取消态**：SCN-006；其它对象 N/A — 本期没有新增用户取消入口。
- [x] **权限态**：SCN-004/SCN-005；只有兜底需要真实用户批准。
- [x] **边界态**：SCN-002、SCN-010、SCN-019、SCN-024、SCN-027。
- [x] **竞态**：SCN-007/SCN-009/SCN-011、SCN-018、SCN-025/SCN-026。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：research 当前不属于任何 stage completion predicate。
  - **status**：`verified`
  - **证据**：decision-log FACT-019/020 与 D-002。
  - **关联**：FR-RESEARCH-002、AC-RESEARCH-002。
- **PFACT-002**：现有 research reader 把 research 错当测试回执，不能认证 `research-report.v1`。
  - **status**：`verified`
  - **证据**：decision-log FACT-021/022/043 与当前代码调查。
  - **关联**：FR-RESEARCH-001、AC-RESEARCH-001。
- **PFACT-003**：用户遇到的 HTTP 402 可能来自配额、网络、宿主或服务端策略；本轮没有复现其根因。
  - **status**：`inferred`
  - **来源与限制**：research report 与 R5 sidecar；57 次调用未复现 402，只真实观察到 TLS 黑障，R5 未重访远端。
  - **关联**：FR-RESEARCH-003/004、AC-RESEARCH-003、RISK-006。
- **PFACT-004**：当前 anysearch 调用缺稳定失败分类、TLS 全程时限、唯一重试和受控 fallback 事实。
  - **status**：`verified`
  - **证据**：decision-log FACT-029/036/037/039/040。
  - **关联**：FR-RESEARCH-003/004、AC-RESEARCH-003。
- **PFACT-005**：当前合法多执行会被数量判 conflict，再折叠为 fake missing。
  - **status**：`verified`
  - **证据**：decision-log FACT-044～058 的代码和真实 task-store 复现。
  - **关联**：FR-EXECUTION-001～004、AC-EXECUTION-001/002。
- **PFACT-006**：public stage status 词表不包含 `conflict` 或 `ambiguous`。
  - **status**：`verified`
  - **证据**：decision-log FACT-053 与 acceptance-draft 数据状态。
  - **关联**：FR-EXECUTION-002～004、AC-EXECUTION-001/002。
- **PFACT-007**：integration review 谓词只认 recorded；capability proof 不是当前谓词或事实。
  - **status**：`verified`
  - **证据**：decision-log FACT-075～079 与 D-006。
  - **关联**：FR-REVIEW-001/002、AC-REVIEW-001。
- **PFACT-008**：存在零生产消费者的死门、静默失效守卫、重复投影和治理登记漂移。
  - **status**：`verified`
  - **证据**：decision-log FACT-061～074 与 D-007。
  - **关联**：FR-GOVERNANCE-001～005、AC-GOVERNANCE-001。
- **PFACT-009**：生产 reflection 当前缺 executor，真实自动路径得到 `unavailable/executor_absent`。
  - **status**：`verified`
  - **证据**：`quality/evidence/stage-reflection-availability/86f7629293daa3702ff13cfd1174a813a0cc228f3aa14befaccb3c67e8f73f2e.json`。
  - **关联**：FR-REFLECTION-001/002、AC-REFLECTION-001、OPEN-004。
- **PFACT-010**：旧 handoff 过薄、落点与 taskPath 不同，无法承担当前续接需要。
  - **status**：`verified`
  - **证据**：decision-log FACT-011～018 与 D-009。
  - **关联**：FR-HANDOFF-001～004、AC-HANDOFF-001。
- **PFACT-011**：`decision-log.md material navigation is incomplete` 是诊断工具键名错误，不是材料缺陷。
  - **status**：`verified`
  - **证据**：decision-log「增量诊断事实与纠正」NAV-FALSE 与 D-010；生产构建入口去掉 `.md` 后缀后 decision-log 不要求 navigation。
  - **关联**：FR-MATERIAL-002、AC-MATERIAL-001。
- **PFACT-012**：UI applicability 的自由文本来源会被英文词法规则误判为 `ui`，与顶层 `non_ui` 冲突并投影为 `missing`。
  - **status**：`verified`
  - **证据**：decision-log「增量诊断事实与纠正」UI-SHAPE 与 D-010。
  - **关联**：FR-MATERIAL-001、AC-MATERIAL-001。
- **PFACT-013**：status 与 completion 读取不消费任务索引或协议错误事实文件；`quality/verify.json` 除初始化外没有生产写入者，且存在可写 canonical task root 的第二写入者。
  - **status**：`verified`
  - **证据**：decision-log「增量诊断事实与纠正」RC-A-MECH / VERIFY-PUB / SECOND-WRITER 与 D-013。
  - **关联**：FR-GOVERNANCE-006、AC-GOVERNANCE-002。
- **PFACT-014**：本任务没有 Web、移动或图形 UI。
  - **status**：`not_applicable`
  - **不适用理由**：decision-log 的 `UI applicability` 三输入结论为 `non_ui`，R-001～R-024 只涉及 CLI、runtime、skills、workflows 和文件产物。
  - **关联**：FR-RESEARCH-001～004、FR-EXECUTION-001～004、FR-REVIEW-001～003、FR-GOVERNANCE-001～007、FR-REFLECTION-001/002、FR-HANDOFF-001～004、FR-MATERIAL-001/002、FR-PERFORMANCE-001/002；AC-RESEARCH-001～003、AC-EXECUTION-001/002、AC-REVIEW-001/002、AC-GOVERNANCE-001/002、AC-REFLECTION-001、AC-HANDOFF-001、AC-MATERIAL-001、AC-PERFORMANCE-001 的 UI 分支均 N/A。

- **PFACT-015**：quality gap 与 release gap 当前由同一数组派生，一个根因会被展开为多条提示。
  - **status**：`verified`
  - **证据**：decision-log「增量诊断事实与纠正」GAP-ALIAS 与 D-013。
  - **关联**：FR-GOVERNANCE-007、AC-GOVERNANCE-002。
- **PFACT-016**：官方 acceptance 整文件在 180 秒被人工终止并保持 `unknown`；慢因是完整 fixture 重复执行与同步 Git 子进程放大。
  - **status**：`verified`
  - **证据**：decision-log R-023、D-012 与本任务定向诊断事实。
  - **关联**：FR-PERFORMANCE-001/002、AC-PERFORMANCE-001。
- **PFACT-017**：外部根因文档的“根因 A”机制不成立——状态与完成度读取不消费任务索引或协议错误事实文件。
  - **status**：`verified`
  - **证据**：decision-log「增量诊断事实与纠正」RC-A-MECH 与 D-013；生产读取链走目录扫描与 `quality/verify.json` 字节。
  - **关联**：FR-GOVERNANCE-006、AC-GOVERNANCE-002、NG-009。
## 5. 功能需求

### 调研事实（RESEARCH）

调研事实只有一个 canonical reader 和一个内容寻址命名空间；completed、skipped、unavailable 都是事实终态，不是质量 pass。

- **FR-RESEARCH-001**：每次 research 生成 `research-report.v1`，路径为 `quality/evidence/research/<sha256>.json`；`receipts.research` 直接引用这份原件，不再套 `workflowhub-receipt.v1` 或生成第二个 receipt。文件名 hash 等于 reader 读取到的完整 UTF-8 JSON 原始字节 SHA-256，reader 不重序列化。common fields 至少含 `schema_version`、`task_id`、`stage`、`snapshot_tree`、`material_scope_revision`、`status`、`question`、`decision_axis`、`tool_usage`、`open_items` 和 `review`；三态互斥穷尽。completed 额外要求 rounds/sources/evidence/triangulation/coverage/saturation；skipped 要求 reason/non-impact basis/evidence refs；unavailable 要求 error class/reason/pending questions/fallback approval status。历史缺新字段的记录只读，不得冒充 current。
  - **范围边界**：单一内容寻址 research 原件；不借测试回执，不建第二文件。
  - **依据**：R-001/R-002、D-001、PFACT-002。
  - **场景**：SCN-001/SCN-002/SCN-004/SCN-006。
  - **验收**：AC-RESEARCH-001。
- **FR-RESEARCH-002**：status 内的 `research` 披露从当前 authenticated research fact 单源派生，字段含 `status`、`report_ref`、`report_sha256`、`required_questions`、`covered_questions`、`tool_attempts`、`gaps[{question_id,code,reason,next_action}]` 和 `fallback{approval_status,requested_route,used_routes}`。无 current fact 时显示 `unavailable/research_record_missing`。该字段和 research 缺口不进入 completion predicates、missing 或 actionable_now；阶段末摘要与 handoff 只读取该字段。
  - **范围边界**：不另建 `research_gaps` 平行数组。
  - **依据**：R-001、D-002、PFACT-001。
  - **场景**：SCN-001/SCN-002/SCN-004/SCN-006。
  - **验收**：AC-RESEARCH-002。
- **FR-RESEARCH-003**：首选检索每次 attempt 的端到端时限为 30 秒，每个问题最多 2 次 attempt（初次加唯一一次重试），active tool 总预算为 120 秒；等待用户答复的墙钟时间不计入 active budget。attempt 固定记录 route、序号、status、elapsed、HTTP status、error code 和安全消息；状态只取 `ok/usage_error/auth_error/http_error/timeout/tls_unreachable/quota`。HTTP 402 只有在 provider 明确给出配额/计费证据时归 quota，否则保留为 `http_error`，不得猜根因。
  - **范围边界**：用法、认证和不可重试 4xx 直接进入批准询问；timeout、TLS、408、429、5xx 或明确 quota 最多重试一次。
  - **依据**：R-001/R-002、D-003、PFACT-003/004。
  - **场景**：SCN-003/SCN-004。
  - **验收**：AC-RESEARCH-003。
- **FR-RESEARCH-004**：首选路由不能继续后只向用户请求一次降级批准；状态从 `not_requested` 进入 `awaiting_user_approval`，再进入 `approved` 或 `declined`。只有 approved 才使用宿主 `web_search` 与 `web_fetch`，并记录两者 provenance；awaiting/declined 生成 unavailable fact。后续成功写新 completed fact，不覆盖旧 unavailable fact。
  - **范围边界**：宿主能力由调用方显式提供；规格不假设仓内 CLI 自带该能力。
  - **依据**：R-002、D-003、PFACT-004。
  - **场景**：SCN-004/SCN-005/SCN-006。
  - **验收**：AC-RESEARCH-003。

### 执行结果与状态（EXECUTION）

- **FR-EXECUTION-001**：current authenticated completed cohort 只包含 task、stage、run、snapshot tree、material scope revision、steps manifest hash 和 skills manifest hash 全等的 completed 执行。读取时派生语义签名，包含整体 status、声明的 required step 集合及各项 terminal status、声明的 skill 集合及各项 status/trigger/executed；attempt ID、producer/session、时间、cost、摘要和原件引用不参与比较。签名唯一时任一执行可证明 execution completed，并披露总 attempt 数；不排序、不增加 selector。
  - **范围边界**：历史、foreign、failed 和 incomplete 执行不参与 completed cohort 比较。
  - **依据**：R-013/R-018、D-004、PFACT-005/006。
  - **场景**：SCN-007。
  - **验收**：AC-EXECUTION-001。
- **FR-EXECUTION-002**：现有 status 输出增加独立 `execution_outcome` 字段：`status` 只取 public 五态，`blocking=false`，并含 `attempt_count`、`completed_attempt_count`、`refs` 和可空 `diagnostic{kind,reason,refs}`。internal diagnostic 只取 `conflict/ambiguous`（与 D-004/D-005 一致；不引入无生产者来源的第三个 kind），不得进入 public status。无 current outcome 显示 unavailable；等价 completed 显示 completed；其它真实终态如实显示。
  - **范围边界**：这是既有 status 投影内字段重排，不是新持久对象或新状态投影。
  - **依据**：R-013/R-018、D-005、PFACT-005/006。
  - **场景**：SCN-007/SCN-010/SCN-011。
  - **验收**：AC-EXECUTION-002。
- **FR-EXECUTION-003**：同一 attempt 异字节仍由正式写边界拒绝。不同 attempt 的 completed cohort 若出现多个语义签名，按用户 1A 显示 public `failed` 与 diagnostic conflict，原因是结果内容冲突；所有需要唯一 current outcome 的消费者 fail-loud，不能挑 winner。
  - **范围边界**：review findings、analyzer prose 和 evidence refs 不进入语义签名，避免质量差异制造假冲突。
  - **依据**：R-013/R-018、D-004、本阶段 Clarify 1A、PFACT-005/006。
  - **场景**：SCN-008/SCN-009。
  - **验收**：AC-EXECUTION-001。
- **FR-EXECUTION-004**：同毫秒终态若语义相同则按正常终态处理；语义不同且无法定序时显示 public `failed` 与 diagnostic ambiguous。execution outcome 永不进入 `missing`、`predicates` 或 `quality_status`；unavailable 只归 `external_unavailable`，不归 `actionable_now`。
  - **范围边界**：失败只影响必须消费唯一 outcome 的结构边界，不成为下一 stage 的推进许可证。
  - **依据**：R-013、D-005、PFACT-005/006。
  - **场景**：SCN-010/SCN-011。
  - **验收**：AC-EXECUTION-002。

### Review 状态（REVIEW）

- **FR-REVIEW-001**：integration review completion predicate 保持现状：只有当前、已认证、正式记录的 review 才满足；unavailable 或 missing 不满足，但不阻止同任务继续修复。
  - **范围边界**：不允许 unavailable 假绿。
  - **依据**：R-017/R-018、D-006、PFACT-007。
  - **场景**：SCN-012/SCN-013。
  - **验收**：AC-REVIEW-001。
- **FR-REVIEW-002**：一次正式 review 生命周期只派生一组一致结论。`recorded` 时 skill row 为 `completed/executed=true`，其 output ref/hash 与 integration review fact 完全相同；provider `unavailable` 时 skill row 与 fact 都保留 unavailable、同一原因和 provenance；receipt 或 lifecycle 缺失时 fact 为 `missing`，skill row 为 `unavailable/reason=session_lifecycle_event_unavailable`，两者都不得宣称完成。不得从另一投影反推或补写成功；capability proof 不得进入谓词。
  - **范围边界**：语义一致指两个消费面都不产生假完成；不要求 `missing` 与 `unavailable` 两套词表使用相同字符串，但不得出现一方宣称完成而另一方未完成；也不建第二个 review 事实源。
  - **依据**：R-017、D-006、PFACT-007。
  - **场景**：SCN-012/SCN-013。
  - **验收**：AC-REVIEW-001。
- **FR-REVIEW-003**：review 预算历史先按可证明的 namespace 归域，再应用语义。可证明属于其它 stage、track、kind、phase 或 subject 的损坏只披露 integrity unavailable，不消耗、不污染、不阻断当前请求，当前请求恰好 dispatch 一次；与当前请求身份完全相同的损坏零 dispatch，报 `REVIEW_RECORD_INCOMPLETE` 并指出损坏引用；无法归域的损坏零 dispatch，保持 `REVIEW_RETRY_BUDGET_UNKNOWN`，不得猜预算。历史坏字节只读保留，不迁移、不覆盖、不写兼容桥。
  - **范围边界**：不新增 selector、历史 ledger 或兼容层；归域依据必须是可读身份字段，不能靠路径猜测。
  - **依据**：R-022、D-011、PFACT-007。
  - **场景**：SCN-025/SCN-026。
  - **验收**：AC-REVIEW-002。

### 控制面治理（GOVERNANCE）

- **FR-GOVERNANCE-001**：零生产消费者的 gate/export 经当前消费证据证明后删除；每个保留控制面必须有唯一 producer、真实 consumer、owner、stage effect、失败语义、replacement 和可观察删除条件。D-007⑤ 的三项登记交付同样纳入：move-map 补登 7 个漏登文件（与 FACT-068 的“6 个条目缺 owner/consumer/delete_condition”是不同口径，不互相否定）、修正 task-close 矛盾条目、删除三个僵尸函数（`quiesceRuntime`/`rebindRuntimeRoot`/`assertLegacyBridgeReadOnly`）。
  - **依据**：R-016、D-007、PFACT-008。
  - **场景**：SCN-014。
  - **验收**：AC-GOVERNANCE-001。
- **FR-GOVERNANCE-002**：finding disposition 校验必须获得当前 stage、snapshot tree、worktree 和 task 等完整身份输入；stale finding 只作为记录型事实，不单独阻止推进。缺身份时显式不可认证，不静默跳过 stale 检查。
  - **依据**：R-016/R-018、D-007、PFACT-008。
  - **场景**：SCN-014。
  - **验收**：AC-GOVERNANCE-001。
- **FR-GOVERNANCE-003**：21 个历史 skip 守卫逐项分类为 `restore`、`retire_with_replacement` 或 `defer`；不得批量恢复已退役控制面，也不得只留 skip 而不给 owner、替代覆盖和退出条件。
  - **依据**：R-016/R-018、D-007、PFACT-008。
  - **场景**：SCN-014。
  - **验收**：AC-GOVERNANCE-001。
- **FR-GOVERNANCE-004**：quality/release/product-release gap 只保留一个 canonical 派生源；仍需兼容的公开名称只能读取同一值，不得分别推导或复制不同结论。
  - **依据**：R-016、D-007、PFACT-008。
  - **场景**：SCN-014。
  - **验收**：AC-GOVERNANCE-001。
- **FR-GOVERNANCE-005**：交付逐对象控制面清单，至少列 object、producer、reader、real consumer、owner、stage effect、current status、constitution clause、disposition、replacement、delete condition、phase 和 evidence；每项结论必须实际落地或明确延期。
  - **依据**：R-016、D-007、PFACT-008。
  - **场景**：SCN-014。
  - **验收**：AC-GOVERNANCE-001。
- **FR-GOVERNANCE-006**：`quality/verify.json` 是既有逐 AC 产品结果权威，必须由唯一生产写入者发布并在写入后立即可读；任何能绕过该写入者写进 canonical task root 的第二写入者必须补齐同等边界校验或被删除。发布失败保留真实错误，不得手写状态改绿。该对象进入控制面清单逐项处置，不退役。
  - **范围边界**：不为任务索引或协议错误事实文件新增写入者；它们当前没有状态消费者。
  - **依据**：R-024、D-013、PFACT-013。
  - **场景**：SCN-028。
  - **验收**：AC-GOVERNANCE-002。
- **FR-GOVERNANCE-007**：quality、release 与 close 投影中的同一上游缺口必须按根因归并，默认每个根因只显示一次并标注受影响视图与 owner；展开视图时仍可看到派生项。不得把同一根因报成多个独立阻塞。
  - **范围边界**：这是既有 gap 记录上的归并字段，不新增第二投影对象或第二状态机。
  - **依据**：R-024、D-013、PFACT-015。
  - **场景**：SCN-029。
  - **验收**：AC-GOVERNANCE-002。

### 自动复盘（REFLECTION）

- **FR-REFLECTION-001**：五个正式 stage 结束时自动调用生产 reflection executor。每份当前记录绑定 executor 标识、真实 attempt、输出 hash、task、stage、snapshot tree 和 material revision；成功状态只取 ok/degraded。生产宿主必须提供真实 session/memory 输入，确定性 runtime 不得伪造 judgment。
  - **依据**：R-018、D-008、PFACT-009。
  - **场景**：SCN-015。
  - **验收**：AC-REFLECTION-001。
- **FR-REFLECTION-002**：reflection 总时限沿用 30 秒；executor 缺失、未调度、超时或执行失败分别保留真实 unavailable/failed 原因；`executor_absent` 视为上游缺 executor 的等价原因，同样判失败。失败不得覆盖原 stage 结果、不得阻止同任务修复或 stage completion，也不得生成假 judgment。
  - **依据**：R-018、D-008、PFACT-009。
  - **场景**：SCN-016。
  - **验收**：AC-REFLECTION-001。

### 阶段交接（HANDOFF）

- **FR-HANDOFF-001**：make-decision、build-spec、build-plan、build-code 在唯一 stage-end hook 内先完成 reflection 终态处理，再调用 `stage-handoff`；不新增 stage、steps 节点或第二个 hook。reflection unavailable 仍尝试 handoff。
  - **依据**：R-003～R-007/R-019/R-020、D-009、PFACT-010。
  - **场景**：SCN-017/SCN-019。
  - **验收**：AC-HANDOFF-001。
- **FR-HANDOFF-002**：目标唯一为 `<taskPath>/quality/evidence/handoff/<stage>.md`。front matter 固定包含 schema、task、stage、snapshot tree、material scope revision、reflection status、`authority: non_authoritative`、`retention: current_only`，以及带 ref/hash 的 source refs；正文顶部显示“非权威 current handoff，只以四材料和正式质量原件为准”。按用户 2B，成功生成时原子覆盖并回读当前绑定和 13 个区块；不生成 hash archive、backup、attempt 版本或历史索引。
  - **范围边界**：该文件是非权威、可替换的 current-view handoff projection，不是 report、receipt、quality fact 或完成证据；reports immutable 继续完整适用于 research、reflection、stage outcome 和 review/receipt。
  - **依据**：R-005/R-006/R-019、D-009、本阶段 Clarify 2B、PFACT-010。
  - **场景**：SCN-018/SCN-020。
  - **验收**：AC-HANDOFF-001。
- **FR-HANDOFF-003**：正文严格保持 13 个区块及顺序：任务身份；背景与目标；当前阶段与进度；重要决策；核心方案；踩过的坑；重要参考调研；关键事实与数据状态；成功与失败边界；未决项与风险；下一步动作；待读文件清单；可自行判断与必须问用户的边界。内容只做结论、索引和指针，不复制四材料正文；“下一步动作”恰好一个。
  - **依据**：R-003/R-004/R-019、D-009、PFACT-010。
  - **场景**：SCN-017/SCN-021。
  - **验收**：AC-HANDOFF-001。
- **FR-HANDOFF-004**：阶段末大白话摘要必须打印完整绝对路径。写入失败时仍打印目标路径、unavailable 原因和旧文件可能 stale 的警告；不能把旧文件报成 current。handoff 失败不改变 reflection 发布结果或 stage completion，reflection 失败也不取消 handoff 尝试。
  - **依据**：R-007/R-020、D-009、PFACT-010。
  - **场景**：SCN-019/SCN-020/SCN-021。
  - **验收**：AC-HANDOFF-001。

### 材料契约（MATERIAL）

UI applicability 是 decision-log 拥有的可重算事实；生产者与读者必须使用同一判定规则。

- **FR-MATERIAL-001**：UI applicability 由三个具名输入（原始需求、项目清单、计划或已发生的改动事实）按同一规则合并得出。每个输入必须携带显式结论（`ui`、`non_ui` 或 `unknown`）与依据，不得依赖自然语言关键词推断；顶层结论必须等于三输入派生结论，否则 fail-loud。来源缺失或结论未知时结果保持 `unknown` 并带原因与 handoff，禁止默认填 `non_ui`。
  - **范围边界**：这是既有 decision-log 事实的形状与合并规则，不新增 stage、材料或 gate。
  - **依据**：R-021、D-010、PFACT-012。
  - **场景**：SCN-022/SCN-023/SCN-024。
  - **验收**：AC-MATERIAL-001。
- **FR-MATERIAL-002**：final packet readiness 必须以生产构建入口为准，不得用手写对象或错误键名替代；`decision-log` 键本身不要求 material navigation，因此"decision-log 缺 navigation"不得再作为 degraded 规划输入的理由。写入方在落盘当下执行与 reader 相同的校验。
  - **范围边界**：只纠正读取与校验入口，不新增第五材料或 navigation 对象。
  - **依据**：R-021、D-010、PFACT-011。
  - **场景**：SCN-022。
  - **验收**：AC-MATERIAL-001。

### 性能预算（PERFORMANCE）

身份校验与 official fixture 的耗时按性能事实处理，不用删除校验换速度。

- **FR-PERFORMANCE-001**：同一次 authenticated operation 内，已校验的 workspace identity 可复用，多次读取不得重复触发同步身份校验；跨 operation、身份变化与写入边界必须重新校验。任何提速都不得跳过或放宽身份、快照与材料校验。
  - **范围边界**：缓存作用域严格限于单次 authenticated operation；不新增持久缓存或跨会话复用。
  - **依据**：R-023、D-012、PFACT-016。
  - **场景**：SCN-027。
  - **验收**：AC-PERFORMANCE-001。
- **FR-PERFORMANCE-002**：official fixture 在一条验收路径内只构造一次，纯载荷变体以表驱动覆盖；单次执行必须满足登记的 wall-time 与 Git 子进程 spawn 次数预算。"upstream outcome 非 current 仍可运行"保留精确回归，建议 60 秒硬上限。
  - **范围边界**：预算数值与 oracle 形式由 build-plan 定稿；本规格只要求存在可判真的预算与负例。
  - **依据**：R-023、D-012、PFACT-016。
  - **场景**：SCN-027。
  - **验收**：AC-PERFORMANCE-001。

## 6. 模块划分

### 调研事实

- **负责什么**：保存 research 三态、来源、失败、覆盖和待补问题。
- **对外提供什么**：当前 research fact 与 status/summary 披露。
- **依赖谁**：make-decision 的问题判断、宿主检索和原文读取能力。
- **测试边界**：hash、身份、变体字段和非谓词行为可独立验收。

### 执行状态

- **负责什么**：认证 current outcome cohort，派生语义签名和公开 execution 状态。
- **对外提供什么**：单一 `execution_outcome` 字段及内部诊断。
- **依赖谁**：不可变 stage outcome 原件和当前 snapshot/material 身份。
- **测试边界**：0/1/多等价/多矛盾/同身份异字节可独立验收。

### Review 状态

- **负责什么**：让 skill row 和 integration review fact 表达同一正式 review 生命周期；预算历史先归域再判语义。
- **对外提供什么**：严格 recorded/unavailable/missing 结论与三分支预算结果。
- **依赖谁**：异源 review 的 canonical attempt/result、可读的请求身份字段。
- **测试边界**：三种结论、身份漂移、缺生命周期，以及无关/当前/不可归域三类损坏可独立验收。

### 控制面治理

- **负责什么**：逐对象登记、消费证据和 retain/repair/delete/defer 处置；verify 摘要的唯一写入者；gap 按根因归并。
- **对外提供什么**：可审计 inventory 与实际落地结果、唯一可读的 verify 摘要、按根因归并的状态输出。
- **依赖谁**：当前生产者、消费者、持久对象和宪法条款。
- **测试边界**：删除后的负向存在性、保留项登记、重复派生、第二写入者负例和同根因归并可独立验收。

### 自动复盘

- **负责什么**：五 stage 的真实自动 judgment 执行与不可变记录。
- **对外提供什么**：当前 reflection 状态、ref/hash 和失败原因。
- **依赖谁**：生产宿主的 session/memory executor。
- **测试边界**：成功、超时、异常、executor 缺失和非阻断可独立验收。

### 阶段交接

- **负责什么**：把当前 stage 结论和指针生成固定 current-view 文件。
- **对外提供什么**：可复制绝对路径和 13 区块交接内容。
- **依赖谁**：当前四材料、stage outcome、reflection 终态和 taskPath 写入能力。
- **测试边界**：四作者 stage、覆盖、失败隔离、stale 检测和手工读取可独立验收。

### 材料契约

- **负责什么**：三输入 UI applicability 的显式结论、合并规则与生产 packet 校验入口。
- **对外提供什么**：可重算的 `ui`/`non_ui`/`unknown` 事实及冲突、缺失原因。
- **依赖谁**：decision-log 的三输入事实与生产构建入口。
- **测试边界**：结构化通过、声明冲突、来源缺失三类可独立验收。

### 性能预算

- **负责什么**：单次 authenticated operation 内的身份校验复用与 official fixture 共享。
- **对外提供什么**：wall-time 与子进程计数的可判真预算，以及身份变化负例。
- **依赖谁**：authenticated operation 边界、身份/快照校验和 fixture 构造入口。
- **测试边界**：预算内通过、超预算失败、提速后身份变化仍 fail-loud 可独立验收。

## 7. 关键实体

- **Research Fact**：一条 task/stage/current binding 下的 completed、skipped 或 unavailable 调研事实；文件按原始字节内容寻址，状态变体字段互斥。
- **Research Tool Attempt**：一次具体 route 调用，含序号、状态、耗时、HTTP/错误信息和是否可重试；不等于 research 完成。
- **Stage Outcome Cohort**：当前身份完全一致的 authenticated completed outcome 集合；读取时派生语义签名，不持久化 selector。
- **Execution Outcome**：status 输出中的只读派生字段；public 五态与 internal diagnostic 分离，`blocking=false`。
- **Integration Review Fact**：与正式 review lifecycle 共用 ref/hash 的 build-code 质量事实；只有 recorded 满足现有谓词。
- **Reflection Record**：绑定真实生产 executor、运行身份和当前材料的不可变 judgment 记录。
- **Stage Handoff**：固定路径、可原子替换、无历史版本的非权威 current-view projection；只供用户和下一会话续接。
- **Control-plane Inventory Entry**：一个控制面对象的生产、消费、影响、处置和退出条件记录。
- **UI Applicability Fact**：由三个具名输入按同一规则合并的可重算事实；每个输入带显式结论，顶层结论必须等于派生结论。
- **Review Budget Namespace**：由 stage、track、kind、phase、subject 与当前身份构成的归域键；决定一条预算历史属于无关、当前还是不可归域。
- **Performance Budget**：单次 authenticated operation 与 official fixture 的 wall-time 与子进程计数上限，附身份变化负例。
- **Root-cause Gap**：把 quality、release、close 三处派生项归并到同一上游缺口的状态记录字段。

## 8. 数据和生命周期

- **数据粒度**：research 每次事实一件；stage outcome 每 attempt 一件；review/reflection 每正式身份一件；handoff 每 stage 只有一个当前文件。
- **数据时效**：所有 current 消费均绑定 task、stage、snapshot tree 和 material revision；身份漂移后旧原件只读，不作为当前。
- **缺失或迟到**：缺 research/outcome/review/reflection/handoff 按各自 unavailable/missing 语义披露；不补零、不补答复、不扫描历史 latest 冒充当前。
- **预览与正式**：status/summary 是只读投影；canonical research、stage outcome、review、receipt 和 reflection 原件才是正式事实。handoff 明确不是正式事实。
- **当前与历史**：research、stage outcome、review、receipt、reflection 保留不可变历史；handoff 按用户 2B 原子覆盖且不保留旧版本。
- **归属与清理**：taskPath 持有质量事实和 handoff；worktree 持有四材料。旧正式原件只读；handoff 的成功覆盖由当前 stage owner 执行。控制面清单是 worktree 内的文档产物（owner=architecture governance；consumer=实施与验证审查；删除条件=move-map 能原生表达同等逐对象处置且 consumer 已迁移）。
- **归域与隔离**：review 预算历史按 namespace 键归域；无关损坏只读保留并披露，不迁移、不覆盖。
- **性能事实**：identity 校验复用只存在于单次 authenticated operation 内；跨边界必须重新校验，性能事实不得成为放宽校验的理由。

## 9. 兼容性预留

- **既有消费方**：保持七类 public command、四材料 authority 和现有质量 predicates；integration review 仍只认 recorded。
- **命名预留**：`execution_outcome` 使用 public 五态；conflict/ambiguous 只作为 diagnostic kind，避免污染 stage status 词表。
- **容器预留**：research fact 的 common fields 和状态变体允许未来新增非阻断诊断，但不得新增平行 gap projection。
- **状态预留**：历史 research report 缺新字段时保持 legacy/incomplete，不批量重写；当前生产者必须满足新绑定。
- **扩展边界**：handoff fixed path 的覆盖规则只适用于 stage-handoff current view，不扩展到任何 immutable report；verify-code handoff 仍延期。
- **契约预留**：UI applicability 的输入结论取值固定为 `ui`/`non_ui`/`unknown`；预算归域键只允许新增可读身份字段，不得引入路径猜测或 selector。
- **反射输入预留**：official `run` 增加 plain JSON `stage_reflection` sibling 输入（owner=当前 host；consumer=`stageReflectionPublication`→`runStageEndReflection`；不是 receipt/fact；删除条件=同职责的审查后 host-executor contract 取代）。

## 10. 明确不做与默认必须成立

### 明确不做

- **NG-001**：不改仓库外旧 `handoff` / `receive-handoff`；来源 D-009。
- **NG-002**：不新增 stage、质量门、四材料 schema、第二状态机、ledger 或独立 status projection；来源 D-002/D-005/D-007/D-009。
- **NG-003**：本规格不授权 commit、push、merge、archive、cleanup 或 close；来源 R-008 的阶段边界。
- **NG-004**：verify-code 的 stage-handoff 延期到 DEFER-001；来源 D-009。
- **NG-005**：不把 capability proof 升格为 build-code predicate；来源 D-006。
- **NG-006**：不自动补写缺失事实、用户答复、生命周期或执行身份；来源 D-001/D-005/D-008。
- **NG-007**：不自动发现 handoff；用户继续手工粘贴阶段末通告路径；来源 D-009/G2=B。
- **NG-008**：不保存 stage-handoff 旧版本；来源本阶段 Clarify 2B。
- **NG-009**：不为任务索引或协议错误事实文件补写内容以消除"空数组"；它们当前没有状态消费者，补写属新增控制面；来源 D-013。
- **NG-010**：不迁移、不删除、不改写历史坏 review 字节；只做归域与隔离；来源 D-011。
- **NG-011**：不用删除或放宽身份、快照、材料校验来换取测试速度；来源 D-012。
- **NG-012**：不退役 `quality/verify.json`；它仍是既有逐 AC 产品结果权威；来源 D-013/T4-Q3=A。

### 默认必须成立

- task/worktree/runtime 身份、hash、顺序和正式 publication 结构错误继续 fail-loud；关联 FR-EXECUTION-003、AC-EXECUTION-001。
- quality、research、reflection 和 handoff 事实不作为开始或继续修复的许可证；关联 FR-RESEARCH-002/FR-REFLECTION-002/FR-HANDOFF-004。
- 缺测试、逐 AC 结果或独立审查时不得宣称实现或验证完成；关联全部 AC。
- UI 事实的写入与读取使用同一判定规则；来源缺失或冲突时保持 `unknown`，不得默认 `non_ui`；关联 FR-MATERIAL-001、AC-MATERIAL-001。
- 无关历史损坏只披露不阻断，当前或不可归域损坏必须 fail-closed；关联 FR-REVIEW-003、AC-REVIEW-002。
- 性能预算只约束耗时与子进程，不改变任何身份、快照或材料校验；关联 FR-PERFORMANCE-001/002、AC-PERFORMANCE-001。
- 原始 provenance、unavailable、partial、failed 和 unknown 不得改写为成功；关联全部 FR/AC。

## 11. 验收标准

- [ ] **AC-RESEARCH-001**：调研事实可核验；对应上游验收草案第 1 项。
  - **需求**：FR-RESEARCH-001。
  - **来源/决策**：R-001/R-002、D-001。
  - **可观察场景**：SCN-001/SCN-002/SCN-004/SCN-006。
验证：观察需调研、合法跳过和不可用三类场景产生的机器事实，核对原始字节 hash、当前身份、来源结构和状态变体字段。
通过：completed 至少含一个问题、三个来源且至少一个一手来源、关键结论原文定位、triangulation 和 saturation 理由；skipped 含问题、理由和依据；unavailable 含失败、待补问题和批准状态；三态均由当前 reader 认证。
失败：无事实、hash 或身份不符、借用测试回执、空来源/原文/三角测量却 completed，或 skipped/unavailable 只有自由文本。
证据：内容寻址 research fact、schema/hash 验证、current reader 消费记录。

- [ ] **AC-RESEARCH-002**：调研缺口可见但不阻断；对应上游验收草案第 2 项。
  - **需求**：FR-RESEARCH-002。
  - **来源/决策**：R-001、D-002。
  - **可观察场景**：SCN-001/SCN-002/SCN-004/SCN-006。
验证：分别观察 completed、skipped、awaiting approval、declined 和 tool unavailable 时的 status、阶段摘要与质量谓词。
通过：research 字段和摘要完整反映机器事实、原因及待补问题；research 状态不改变 `quality_status`、completion predicates、missing 或 actionable_now。
失败：research 进入完成谓词，或摘要无机器事实来源，或另建重复 gap 数组。
证据：status/summary 投影、predicate inventory 和三态事实引用。

- [ ] **AC-RESEARCH-003**：fallback 可执行；对应上游验收草案第 3 项。
  - **需求**：FR-RESEARCH-003、FR-RESEARCH-004。
  - **来源/决策**：R-001/R-002、D-003。
  - **可观察场景**：SCN-003～SCN-006。
验证：覆盖 usage/auth/http/timeout/TLS/quota 失败、唯一重试、120 秒 active budget、等待、批准、拒绝和兜底成功。
通过：失败分类准确；每 attempt 30 秒；最多重试一次；只有真实 approved 后同时登记 `web_search` 与 `web_fetch`；所有状态转换和 provenance 留痕。
失败：静默降级、无限等待或重试、把未证实的 402 根因写成 quota、未批准调用兜底，或只登记搜索/原文读取之一。
证据：tool attempt 记录、批准事实、research facts 和时限行为证据。

- [ ] **AC-EXECUTION-001**：合法重试不产生假阻塞，真实冲突 fail-loud；对应上游验收草案第 4 项。
  - **需求**：FR-EXECUTION-001、FR-EXECUTION-003。
  - **来源/决策**：R-013/R-018、D-004、Clarify 1A。
  - **可观察场景**：SCN-007～SCN-009。
验证：在其它 predicates 已满足时，观察一个 completed、多个等价 completed、同 attempt 异字节和不同 attempt 语义冲突。
通过：等价执行公开 completed 且数量准确；同 attempt 异字节拒绝写入；语义冲突公开 failed/conflict 且消费者拒绝选 winner；其它谓词未被放宽。
失败：等价执行被判 conflict/missing；冲突结果被静默选择；或仅凭 execution outcome 判整体质量完成。
证据：authenticated outcome fixtures、status 投影和唯一结果消费者行为记录。

- [ ] **AC-EXECUTION-002**：执行事实与质量谓词分离；对应上游验收草案第 5 项。
  - **需求**：FR-EXECUTION-002、FR-EXECUTION-004。
  - **来源/决策**：R-013/R-018、D-005。
  - **可观察场景**：SCN-007/SCN-010/SCN-011。
验证：观察 completed、无 outcome、同毫秒歧义、failed 时的 execution outcome、missing、predicates 和 status grouping。
通过：execution outcome 独立且 `blocking=false`；无 outcome 归 external_unavailable；语义歧义公开 failed 并保留 internal diagnostic；不进入 missing/predicates/quality_status/actionable_now。
失败：仍折叠为 `stage_outcome` missing、改变真实质量谓词，或把 conflict/ambiguous 暴露为 public status。
证据：status projection、grouping 与 completion predicate 行为证据。

- [ ] **AC-REVIEW-001**：build-code review 结论一致；对应上游验收草案第 6 项。
  - **需求**：FR-REVIEW-001、FR-REVIEW-002。
  - **来源/决策**：R-017/R-018、D-006。
  - **可观察场景**：SCN-012/SCN-013。
验证：观察 recorded、unavailable、missing 三种 review 生命周期在 predicate、skill row 和 integration review fact 中的结论。
通过：recorded 才满足谓词；两处 ref/hash 同源且不得出现一方宣称完成而另一方未完成（标签可不同）；unavailable/missing 不满足但不阻止同任务修复；capability proof 不出现在谓词。
失败：unavailable 被当 completed、一方宣称完成而另一方未完成、生命周期缺失却反推成功，或新增 capability proof predicate。
证据：review 原件、envelope/fact 投影和 predicate inventory。

- [ ] **AC-GOVERNANCE-001**：控制面处置可审计；对应上游验收草案第 7 项。
  - **需求**：FR-GOVERNANCE-001、FR-GOVERNANCE-002、FR-GOVERNANCE-003、FR-GOVERNANCE-004、FR-GOVERNANCE-005。
  - **来源/决策**：R-016/R-018、D-007。
  - **可观察场景**：SCN-014。
验证：逐对象核对 inventory、删除/保留/修复结果、21 条 skip 分类、gap 单源派生、治理登记、stale finding 行为，并逐项核对 move-map 7 个漏登文件、task-close 矛盾条目与三个僵尸函数是否按结论落地。
通过：每项有 producer/consumer/owner/stage effect/decision/exit；死门与僵尸项按证据删除；保留项登记齐全；别名单源；skip 逐项分类；stale finding 只记录。
失败：只有聚合数字或清单未落地、批量恢复旧 gate、重复派生继续存在，或记录型守卫阻断推进。
证据：控制面 inventory、反向引用与负向存在性证据、行为记录和治理登记。

- [ ] **AC-REFLECTION-001**：五个正式 stage 自动复盘真跑；对应上游验收草案第 8 项。
  - **需求**：FR-REFLECTION-001、FR-REFLECTION-002。
  - **来源/决策**：R-018、D-008。
  - **可观察场景**：SCN-015/SCN-016。
验证：逐一观察五个正式 stage 的自动 reflection，并覆盖真实 executor 成功、超时、异常和缺失。
通过：五个 stage 的成功记录均含生产 executor、attempt、output hash 和 current binding，status 为 ok/degraded；真实失败原因被保留且不阻断。
失败：`executor_absent`、`executor_not_injected`、`not_scheduled`、缺当前绑定、失败被伪装成功，或失败反向阻断 stage。
证据：current reflection records、executor attempt、output hash 和 stage completion 行为证据。

- [ ] **AC-HANDOFF-001**：四个作者 stage 的交接可续接；对应上游验收草案第 9 项。
  - **需求**：FR-HANDOFF-001、FR-HANDOFF-002、FR-HANDOFF-003、FR-HANDOFF-004。
  - **来源/决策**：R-003～R-007/R-019/R-020、D-009、Clarify 2B。
  - **可观察场景**：SCN-017～SCN-021。
验证：逐一观察四作者 stage 成功、重跑覆盖、reflection unavailable、handoff 写失败和新会话手工读取。
通过：reflection 终态后生成固定 `<stage>.md`；front matter 与 13 区块绑定 current stage/snapshot/material，含 `authority: non_authoritative`、`retention: current_only` 和带 hash 的 source refs，正文有非权威 banner；重跑原子覆盖且无历史版本；摘要打印完整绝对路径；任一失败如实披露且双向隔离。
失败：新增 stage/step；handoff 早于 reflection；旧文件冒充 current；保存多版本；缺路径；失败被吞掉；handoff/reflection 互相阻断。
证据：current handoff、stage-end 摘要、绑定回读、失败隔离与新会话读取记录。

- [ ] **AC-MATERIAL-001**：UI 判定与 packet 校验使用同一规则；对应上游 D-010。
  - **需求**：FR-MATERIAL-001、FR-MATERIAL-002。
  - **来源/决策**：R-021、D-010。
  - **可观察场景**：SCN-022/SCN-023/SCN-024。
验证：分别观察三输入均为显式 `non_ui`、声明与来源冲突、来源缺失或未知三类情形，并核对写入当下与读取端结论一致。
通过：结构化三输入得 `non_ui` 且派生一致；冲突当场 fail-loud 并指出来源；缺失或未知保持 `unknown` 并带原因与 handoff；final packet 由生产构建入口生成。
失败：依赖自然语言关键词推断；冲突被静默接受；来源缺失却得 `non_ui`；用手写对象或错误键名替代生产构建入口。
证据：decision-log UI 事实、校验输出、packet 构建结果与负例记录。

- [ ] **AC-REVIEW-002**：预算历史按 namespace 归域；对应上游 D-011。
  - **需求**：FR-REVIEW-003。
  - **来源/决策**：R-022、D-011。
  - **可观察场景**：SCN-025/SCN-026。
验证：分别观察无关损坏、当前身份损坏、不可归域损坏三种历史，统计 provider dispatch 次数与返回错误码。
通过：无关损坏时当前请求恰好 dispatch 一次且原字节保留；当前损坏零 dispatch 并报 `REVIEW_RECORD_INCOMPLETE` 且指出引用；不可归域零 dispatch 并保持 `REVIEW_RETRY_BUDGET_UNKNOWN`。
失败：无关历史导致零 dispatch；当前损坏仍 dispatch；猜预算继续执行；迁移或改写历史坏字节。
证据：预算历史读取结果、dispatch 计数、错误码与原件保留记录。

- [ ] **AC-PERFORMANCE-001**：耗时按性能事实处理；对应上游 D-012。
  - **需求**：FR-PERFORMANCE-001、FR-PERFORMANCE-002。
  - **来源/决策**：R-023、D-012。
  - **可观察场景**：SCN-027。
  - **前置条件**：预算数值由 OPEN-015 关闭后生效；未关闭时本 AC 固定为 `unavailable`，不得计为 passed。
验证：在重复 authenticated 操作与完整 official fixture 上测量 wall-time 与子进程计数，并注入身份变化负例。
通过：单次 operation 内身份校验不重复触发；fixture 只构造一次且纯载荷变体表驱动覆盖；结果落在登记预算内；身份变化、跨 operation 与写入边界仍 fail-loud。
失败：超预算；缓存跨 operation 或跨会话复用；提速后跳过身份、快照或材料校验；把超时人工终止写成 failed 或 passed。
证据：wall-time 与子进程计数、预算登记、身份变化负例行为记录。

- [ ] **AC-GOVERNANCE-002**：verify 发布与根因归并可审计；对应上游 D-013。
  - **需求**：FR-GOVERNANCE-006、FR-GOVERNANCE-007。
  - **来源/决策**：R-024、D-013。
  - **可观察场景**：SCN-028/SCN-029。
验证：观察一次 verify 摘要发布、一个能写 canonical task root 的第二写入者尝试，以及一个根因触发多处 gap 时的 public status 输出。
通过：摘要经唯一写入者发布且写入后可读；第二写入者被拒绝或已删除；同一根因默认只显示一次并可展开派生视图；任务索引与协议错误事实文件未被补成第二权威。
失败：出现可写 canonical task root 的第二写入者；手写状态改绿；同一根因仍被报成多条独立阻塞；为消除空数组而新增写入；按“producer 绕过 canonical writer”的错误机制给任务索引或协议错误事实文件补写。
证据：发布记录、负例拒绝结果、status 归并输出与控制面清单处置。

## 12. 风险、未决与交接

### 风险

- **RISK-001**：用户忘记粘贴 handoff 路径。
  - **受影响 ID**：FR-HANDOFF-004、AC-HANDOFF-001。
  - **触发与后果**：阶段末路径未被带到新会话；新会话只能回退为直接读取四材料。
  - **缓解或 STOP**：摘要始终打印绝对路径；不因便利性新增自动发现。若要自动发现，必须先回 make-decision 形成新决定。
  - **处理 Stage**：build-code；owner=用户工作流。
  - **验证**：新会话手工路径读取场景通过，且无自动发现路径。
- **RISK-002**：review 投影修复后仍有真实质量缺口。
  - **受影响 ID**：FR-REVIEW-001/002、AC-REVIEW-001。
  - **触发与后果**：AC 或正式 review 仍缺；quality 保持 incomplete。
  - **缓解或 STOP**：不放宽现有谓词，逐项补真实事实；缺失时禁止宣称 build-code 完成。
  - **处理 Stage**：build-code。
  - **验证**：recorded/unavailable/missing 三态及完成投影逐项核对。
- **RISK-003**：research fallback 等待用户批准。
  - **受影响 ID**：FR-RESEARCH-004、AC-RESEARCH-003。
  - **触发与后果**：首选路由失败且用户不在场；research 暂为 unavailable。
  - **缓解或 STOP**：保留 awaiting 状态并继续不依赖检索的工作；未经批准不得调用 fallback。
  - **处理 Stage**：build-code。
  - **验证**：等待、批准、拒绝三条状态转换及无静默调用证据。
- **RISK-004**：reflection 与 handoff 的失败互相传播。
  - **受影响 ID**：FR-REFLECTION-001/002、FR-HANDOFF-001～004、AC-REFLECTION-001、AC-HANDOFF-001。
  - **触发与后果**：任一执行异常；另一产物可能未尝试、被覆盖或反向阻断 stage。
  - **缓解或 STOP**：两者各自记录终态并隔离；STOP=任一失败改变另一方已发布结果或阻断 stage。
  - **处理 Stage**：build-plan 设计，build-code 验证。
  - **验证**：双向失败注入下，两项状态均独立可见且 stage 可继续。
- **RISK-005**：stage-handoff 不保留历史。
  - **受影响 ID**：FR-HANDOFF-002、AC-HANDOFF-001。
  - **触发与后果**：同 stage 重跑覆盖旧文件；用户只能读取当前版本。
  - **缓解或 STOP**：这是 Clarify 2B 的已接受取舍；current binding 不符或覆盖失败时必须警告 stale，禁止把旧文件称为 current。
  - **处理 Stage**：build-code。
  - **验证**：重跑后仅一个 current_only 文件，且绑定、banner、失败警告符合合同。
- **RISK-006**：当前 research report 的独立复核只有 partial 覆盖。
  - **受影响 ID**：PFACT-003、FR-RESEARCH-001/003、AC-RESEARCH-001/003。
  - **触发与后果**：把未闭合来源或 402 推断当确定事实；方向证据失真。
  - **缓解或 STOP**：规格只采用代码确认事实，402 根因保持 unresolved；不得把 sidecar 当 pass。
  - **处理 Stage**：build-spec 记录，build-code 不依赖该推断实现分类。
  - **验证**：回读 `quality/evidence/research/reviews/fbf2263dec9a4ed317b21ec077ab200ef9e61f34b8a55919c454d3652b9a53a3.json`，确认 `completed/partial` 与 findings 原样保留。
- **RISK-007**：把"无关坏历史可继续"误读成"忽略所有损坏"。
  - **受影响 ID**：FR-REVIEW-003、AC-REVIEW-002、NG-010。
  - **触发与后果**：真实预算或身份损坏被当作可继续；产生假 dispatch。
  - **缓解或 STOP**：三分支各自具备 dispatch 计数与错误码 oracle；STOP=当前或不可归域损坏仍 dispatch。
  - **处理 Stage**：build-code。
  - **验证**：三类损坏下的 dispatch 计数与错误码逐项核对。
- **RISK-008**：性能缓存过久导致身份变化未被发现。
  - **受影响 ID**：FR-PERFORMANCE-001、AC-PERFORMANCE-001。
  - **触发与后果**：跨 operation 复用旧身份；fail-loud 边界被削弱。
  - **缓解或 STOP**：缓存严格限于单次 authenticated operation；STOP=身份变化或写入边界未重新校验。
  - **处理 Stage**：build-code。
  - **验证**：身份变化与跨 operation 负例均 fail-loud。
- **RISK-009**：照错误机制给任务索引或协议错误事实文件补写。
  - **受影响 ID**：FR-GOVERNANCE-006、AC-GOVERNANCE-002、NG-009。
  - **触发与后果**：形成无人读取的第二权威与双写。
  - **缓解或 STOP**：以真实 reader 链为准；STOP=出现第二权威。
  - **处理 Stage**：build-plan 设计，build-code 评审拒绝。
  - **验证**：负向存在性证据显示无新增写入路径。
- **RISK-010**：增量修订后四材料 hash 与任务卡引用全部变化。
  - **受影响 ID**：全部 FR/AC。
  - **触发与后果**：旧 review、测试与 stage outcome 不再 current，形成重新认证循环。
  - **缓解或 STOP**：build-spec/build-plan 统一重算并通过 current packet；STOP=用旧绑定冒充 current。
  - **处理 Stage**：build-plan。
  - **验证**：四材料 hash、材料范围版本与任务卡引用一致且可回读。

### 上游 OPEN 处置记录

| OPEN | 当前状态 | 本阶段结论 | Owner / handoff | 关闭条件 |
| --- | --- | --- | --- | --- |
| OPEN-001 | resolved | namespace=`quality/evidence/research/`；schema=`research-report.v1`；三态单件 | build-code | 当前 reader/hash/variant 验证通过 |
| OPEN-002 | resolved | 30 秒/attempt、最多 2 attempts、120 秒 active budget | build-code | 时限与失败行为证据通过 |
| OPEN-003 | resolved | current cohort 身份与语义签名已定义；冲突按 1A failed | build-code | 等价/冲突针对性证据通过 |
| OPEN-005 | resolved | reflection 后、固定覆盖、front matter 与 13 区块已定义 | build-code | handoff AC 通过 |
| OPEN-007 | resolved | execution outcome shape 与 internal diagnostic 已定义 | build-code | AC-EXECUTION-002 通过 |
| OPEN-008 | resolved | research disclosure 单源 shape 已定义 | build-code | AC-RESEARCH-002 通过 |
| OPEN-009 | resolved | review lifecycle 是 envelope/fact 唯一结论源 | build-code | AC-REVIEW-001 通过 |
| OPEN-011 | resolved_with_partial | R5 已执行并以 immutable sidecar 落盘；原 report 不改字节 | build-spec | sidecar hash 可回读，partial findings 保留为 RISK-006 |
| OPEN-012 | resolved | 本规格下方保留审查轮次/聚合口径对账 | build-spec | 最终 analyzer 能追溯各轮 ref 与处置 |
| OPEN-013 | resolved | UI 三输入结论取值（`ui`/`non_ui`/`unknown`）与合并规则已定义；字段名留实现 | build-code | AC-MATERIAL-001 通过 |
| OPEN-014 | resolved | 归域键=stage/track/kind/phase/subject + 当前身份；无关/当前/不可归域三分支语义已定义 | build-code | AC-REVIEW-002 通过 |
| OPEN-015 | open | 性能预算数值与 wall-time/spawn oracle 形式待定 | build-plan | 预算与身份变化负例均可判真 |
| OPEN-016 | open | verify 摘要唯一写入者实现点与 canonical guard 方案待定 | build-plan | 第二写入者负例通过 |

- **OPEN-004**：生产 reflection executor 的真实宿主入口待规划。
  - **受影响 ID**：FR-REFLECTION-001/002、AC-REFLECTION-001、RISK-004。
  - **owner**：build-plan。
  - **影响**：不关闭则五阶段仍可能稳定得到 `executor_absent`，无法满足 AC-REFLECTION-001。
  - **处理 Stage**：build-plan；handoff=实现阶段的 executor 注入与失败隔离任务。
  - **关闭条件或 STOP**：plan 明确唯一入口、owner、30 秒超时、五阶段调用、失败隔离、验证命令和 rollback；需要新增 public command/stage 时 STOP 回 make-decision。
- **OPEN-006**：21 条历史 skip 守卫的逐项处置待完成。
  - **受影响 ID**：FR-GOVERNANCE-003/005、AC-GOVERNANCE-001。
  - **owner**：build-plan 负责清单，build-code 负责落地。
  - **影响**：缺逐项分类会导致退役门被误恢复，或有效保护继续静默失效。
  - **处理 Stage**：build-plan；handoff=21 行 inventory 与对应实施 task。
  - **关闭条件或 STOP**：每条有 restore/retire_with_replacement/defer、真实 consumer、替代覆盖、证据和退出条件；无法证明 consumer 时 STOP 删除动作。
- **OPEN-010**：控制面 inventory 的实施分期和文件边界待规划。
  - **受影响 ID**：FR-GOVERNANCE-001～005、AC-GOVERNANCE-001。
  - **owner**：build-plan。
  - **影响**：缺少单一 phase/file owner 会形成跨阶段重复修改、遗漏 rollback 或只列清单不落地。
  - **处理 Stage**：build-plan；handoff=plan phases 与 tasks 卡片。
  - **关闭条件或 STOP**：plan/tasks 给出 P0/P1/P2 阶梯、唯一文件归属、依赖、针对性验证和 rollback；任何新增控制面缺真实 consumer 时 STOP。
- **OPEN-015**：性能预算数值与 wall-time/子进程计数 oracle 形式待规划。
  - **受影响 ID**：FR-PERFORMANCE-001/002、AC-PERFORMANCE-001、RISK-008。
  - **owner**：build-plan。
  - **影响**：没有可判真预算时无法区分"提速有效"与"跳过校验"。
  - **处理 Stage**：build-plan；handoff=独立性能卡与 oracle。
  - **关闭条件或 STOP**：plan 给出预算数值、测量方式、身份变化负例与 60 秒回归上限；任何以放宽身份/快照/材料校验换速度的方案 STOP。
- **OPEN-016**：`quality/verify.json` 唯一写入者实现点与 canonical guard 方案待规划。
  - **受影响 ID**：FR-GOVERNANCE-006、AC-GOVERNANCE-002、RISK-009。
  - **owner**：build-plan。
  - **影响**：写入者缺位则逐 AC 权威长期 `unknown`；guard 缺失则存在第二写入者。
  - **处理 Stage**：build-plan；handoff=发布路径与负例测试。
  - **关闭条件或 STOP**：plan 指定唯一写入者、失败语义与第二写入者负例；任何"给任务索引或协议错误事实文件补写"的方案 STOP。

### 延期

- **DEFER-001**：verify-code 的 stage-handoff。source_status=deferred；owner=后续任务；trigger=用户要求五阶段全覆盖；handoff=未来 handoff 范围决策；保留条件=本期只覆盖四作者 stage；关闭条件=新决定和真实验收。
- **DEFER-002**：`muyu-search-mcp` 是否正式退役。source_status=deferred；owner=后续调研能力任务；trigger=需要第二条仓内检索通道；handoff=未来工具路由治理；保留条件=本期用宿主 web_search/web_fetch；关闭条件=真实能力审计与用户选择。

### 审查与研究对账附录

- direction review：25 条原始 findings 按主题聚合为 FND-001～017；每个 blocking 主题独立处置。
- detail review 三轮：33 / 41 / 36 条；旧提交缺陷和相互矛盾项已在 make-decision 修正。
- make-decision stage-end spec-analyze：29 条 inconsistent → 14 条 inconsistent → consistent，覆盖 20/20，无 CRITICAL/HIGH；剩余登记精度由本规格 OPEN 对账承接。
- research R5：`completed/partial`，2 HIGH、4 MEDIUM；原 research report 保持不可变，sidecar ref 见 RISK-006。D-002 的“research 非谓词”得到支持；D-001/D-003/D-004/D-005 仅部分支持；D-009 最终 hook 架构不由旧 report 证明。
- 2026-09-10 增量修订：并入 R-021～R-024 / D-010～D-013 的 FR-MATERIAL-001/002、FR-REVIEW-003、FR-PERFORMANCE-001/002、FR-GOVERNANCE-006/007，新增 SCN-022～SCN-029 与 AC-MATERIAL-001、AC-REVIEW-002、AC-PERFORMANCE-001、AC-GOVERNANCE-002；本次未重跑独立 review 与 stage-end spec-analyze，两者仍为 `unavailable`/`incomplete`，由最终 analyzer 与 build-plan 阶段承接。

### build-plan 交接

build-plan 只设计工程路径，不重开已确认产品方向。它必须优先关闭 OPEN-004、OPEN-006、OPEN-010、OPEN-015、OPEN-016，验证真实代码锚点、consumer、失败路径和 rollback；将每个 FR/AC 映射到有序 task 和 oracle；不执行实现或 RED/GREEN。**2026-09-10 增量**：build-plan 必须同步更正 `plan.md` 与 `tasks.md` 中"decision-log 缺 material navigation"的假事实（依据 PFACT-011），为 FR-MATERIAL-001/002、FR-REVIEW-003、FR-PERFORMANCE-001/002、FR-GOVERNANCE-006/007 建立独立任务卡与 oracle，且不得把性能修复塞进既有常规 gate 卡。任何必须改变 1A、2B、D-001～D-013 或十三项 AC 的方案都停止并返回相应 owner。

## 13. 业务影响与回归范围

### make-decision 调研

- **既有行为**：research 可缺席或被当测试回执，失败和跳过难以复核。
- **本需求影响**：三态机器事实、内容寻址、失败分类、唯一重试和经批准兜底。
- **回归路径**：成功、合法跳过、等待、拒绝、批准后兜底和工具不可用。
- **验收**：AC-RESEARCH-001～003。

### stage 状态与 build-code review

- **既有行为**：多 current completed 可能被判 conflict/fake missing；同一 review 两处结论相反（2026-09-10 合并后 main 已按 `status !== "unavailable"` 部分收口，剩余一致性仍由 FR-REVIEW-002 要求）。
- **本需求影响**：execution outcome 独立，等价重试通过，语义矛盾公开失败，review 单源派生。
- **回归路径**：0/1/多个等价/多个矛盾 outcome，recorded/unavailable/missing review。
- **验收**：AC-EXECUTION-001/002、AC-REVIEW-001。

### 控制面、reflection 与 handoff

- **既有行为**：死门和重复投影增加维护成本；自动 reflection 缺 executor；handoff 太薄且落点不统一。
- **本需求影响**：逐对象治理、五阶段自动复盘、四作者阶段固定 current-view handoff。
- **回归路径**：控制面处置、五 stage reflection、四 stage handoff 成功/失败/重跑/手工续接。
- **验收**：AC-GOVERNANCE-001、AC-REFLECTION-001、AC-HANDOFF-001。

- **可能受冲击的业务规则**：四材料 authority、不可变正式报告、quality predicates、异源 review、正式写边界和不可逆授权必须保持。
- **明确无影响**：Web/UI、移动端、verify-code handoff、仓库外旧 handoff 技能、物理 close 与历史正式记录。

### 材料契约、review 预算与性能

- **既有行为**：UI 判定依赖自由文本；预算历史被无关坏记录全局锁死；身份校验与 fixture 重复执行放大耗时。
- **本需求影响**：三输入结构化合并；预算历史先归域再判语义；单次 operation 身份复用与 fixture 共享。
- **回归路径**：结构化通过/冲突/缺失；无关/当前/不可归域损坏；重复 operation 与身份变化负例。
- **验收**：AC-MATERIAL-001、AC-REVIEW-002、AC-PERFORMANCE-001。

### verify 发布与根因归并

- **既有行为**：verify 摘要没有生产写入者；一个根因被展开成多条提示。
- **本需求影响**：唯一写入者发布并可读；gap 按根因归并，展开时仍可见派生项。
- **回归路径**：摘要发布与回读、第二写入者负例、同根因多投影。
- **验收**：AC-GOVERNANCE-002。
