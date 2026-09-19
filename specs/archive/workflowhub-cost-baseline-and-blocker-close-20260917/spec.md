# 功能规格：workflowhub 成本基线与阻塞收口

> 基于已接受的需求来源。本文件只写产品问题、行为、边界和验收，不写工程实现方案。

- **功能名**：workflowhub 成本基线与阻塞收口（cost-baseline-and-blocker-close）
- **来源**：decision-log.md（workflowhub-cost-baseline-and-blocker-close-20260917，sha256 22af1df9 开头，1801 行）；26 条 OI 全部终态 confirmed，26 条决定 D-001~D-026 一一对应
- **状态**：草稿（本阶段 build-spec 起草，待规格审查与 stage 收尾确认）

## 速读卡（30 秒）

- **一句话需求**：让 workflowhub 的审查与收口不再空等、不再被 antigravity 型假「模型无输出」浪费、不再因材料写入反复重绑确认与聚合，并把 DEF-01~DEF-07 延期项逐条处置干净。
- **核心改动点**：
  - 审查等待侧加「到期前终态复检」+「不可用审查复用守卫」，20 分钟阈值数字不动；
  - antigravity 根因在外部仓修复（仅授权 6 文件），agy 超时被诚实识别为 PROVIDER_PRINT_TIMEOUT 并纳入重发；
  - 派发前预检扩到 provider 身份/model id/CLI 可执行性/认证/活性探测；审查中非终态暴露成员级真实事实；
  - 输入输出格式按甲/乙/丙三类宽容，7 条审查红线原样保留；
  - 两轨 review 质量事实各绑本轨 result；去掉强制全量重采；净减删除 15 分钟记录锁；两个检查红灯转绿；
  - 收口重绑级联三阶段同批治理（F1/F2、D1、D2、D3、D4 读侧对称），同一次收口只发生一次确认与一次聚合。
- **最大影响面**：wh-review 审查链路（等待、预检、格式解析、事实绑定）与 3rd-review 授权 6 文件；stage 确认读侧判定；skill bundle 声明哈希基线。
- **验收信号**：agy 型失败被识别为超时而非模型空输出；同一次收口 confirm 恰 1 次、交互聚合恰 1 次；check-skill-closure 与 smoke-local-skill-dispatch 均 exit 0；材料实质改动仍使确认失效（不得豁免）；antigravity 在真实审查中不再出现 emitted no final text。

## 材料导航

> 本节可再生成、非权威，仅供 build-spec / build-plan / build-code 快速定位 decision-log.md 关键锚点。行号对应该文件当前版本（1801 行）。

| 节名 | 行号 | 内容摘要 | 建议读取时机 |
| --- | --- | --- | --- |
| 任务身份 | 3-18 | task_id、worktree、branch、基线提交 | S |
| 原始需求（含需求覆盖矩阵） | 20-51 | R-001~R-018 逐条与决定对应 | S |
| 需求权威更新 talk-round-1 | 63-78 | 推翻「减少人工确认点」等三条假设 | S |
| 需求权威更新 talk-round-3 | 79-97 | antigravity 禁止改配置、禁止收敛 1+1 | S |
| 需求权威更新 talk-round-4 | 98-111 | 授权 3rd-review 两处最小修复（A+B） | S |
| 需求权威更新 grill-G2 | 112-155 | 三条新需求、授权改动清单（5 文件＋用户扩展授权第 6 文件守卫测试）、7 条红线 | S |
| 需求权威更新 增量决策 | 156-233 | 收口重绑级联根因、四个坏点、D4 用户裁定 | S |
| 范围 | 235-245 | 范围内四项、明确不在范围内 | S |
| 目标 | 251-256 | 成功意图六条可观察事实 | S |
| 收敛检查 | 257-265 | 目标/范围/方案/验收四维可执行验收 | S |
| 决定 D-001~D-026 | 266-947 | 26 条决定全文（与 OI 一一对应） | B |
| UI applicability | 948-960 | non_ui 三来源一致 | S |
| 拒绝方案 | 961-979 | 14 条被拒方案与否决理由 | B |
| 未决项 | 980-984 | 无未决决定；9 条实现细节层待处置归属 build-spec/build-code | B |
| 最终确认 | 991-1017 | 状态 accepted；四次确认留档与重绑实证 | B |
| Exit checks | 1027-1036 | 七条退出检查 | B |
| 唯一 OI 大纲 | 1037-1433 | 26 条 OI 终态记录（acceptance/counterexample 成对） | S |
| 三轮 talk | 1434-1491 | 四轮结构化问答答复表 | B |
| grill | 1492-1539 | 五类覆盖表与 G1~G4 逐字原话 | B |
| 调研 | 1540-1581 | 根因定位一手数据、antigravity 硬证据链 | S |
| 非目标 | 1582-1596 | 12 条非目标 | S |
| 净减或持平例外清单 | 1597-1612 | 9 条例外（项/新增面依据/删除条件）＋spec 侧登记第 10 条（守卫测试演进） | S |
| 审查处置与 detail 轨 | 1613-1772 | direction/detail 审查结论、争议处置 D1~D20 | B |
| 风险与延期交接 | 1774-1801 | RK-1~RK-12、延期文件为唯一交接载体 | S |

spec-research: skipped — 决策材料 26 条 OI 终态且调研一手数据（33 attempt/72 provider attempt/24 failed/493 provider-分钟、agy 12 次失败 stderr 逐字相同、收口窗口 67.4 min/164 文件实测）已足，无新增接口/数据规则/兼容性事实需要调研。

spec-clarify: trigger=false — 理由：材料完备、无材料歧义（26 条 OI acceptance/counterexample 成对，10 条例外与 6 文件授权清单逐条列明）；open questions: 0（开放问题：0）。

UI 设计路径: not_applicable — 理由：decision-log UI applicability=non_ui（decision-log.md:948-960，三来源一致），本任务零页面、成本数据只走既有 CLI 文本输出，step 7/8/9 skip。

## 来源与决策映射

> 本节只保存 ID 关系，不复制 decision-log 正文。每条 FR/AC 均可回到本表；scope revision 只追加受影响映射。

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001 | D-003、D-004、D-005、D-006、D-011、D-012 | FR-WAIT-001/002、FR-HEALTH-001/002、FR-CLEANUP-001/005 | current | 无 |
| R-002 | D-013、D-016 | FR-CLEANUP-003、FR-GOV-005 | current | 无 |
| R-003 | D-001、D-007 | FR-GOV-001、FR-GOV-010 | current | 无 |
| R-004 | D-001、D-009 | FR-GOV-001、FR-GOV-009 | current | 无 |
| R-005 | D-008、D-009、D-018 | FR-GOV-002、FR-GOV-003 | current | 无 |
| R-006 | D-001、D-008 | FR-GOV-001 | current | 无 |
| R-007 | D-019、D-011 | FR-HEALTH-001、FR-GOV-007 | current | 3rd-review 侧验收单独登记 |
| R-008 | D-017 | FR-GOV-008 | current | 无 |
| R-009 | D-013、D-016 | FR-GOV-005 | current | 无 |
| R-010 | D-018、D-020、D-022~D-025 | FR-GOV-003、FR-CLEANUP-004 | current | 无 |
| R-011 | D-009、D-014 | FR-GOV-002、FR-GOV-009 | current | 无 |
| R-012 | D-015、D-020 | FR-GOV-004 | current | 无 |
| R-013 | D-007 | FR-GOV-010 | current | 无 |
| R-014 | D-021 | FR-BINDING-001/002 | current | 无 |
| R-015 | D-022 | FR-PREFLIGHT-001/002/003 | current | 无 |
| R-016 | D-023、D-025 | FR-HEALTH-003/004、FR-BROKER-001/002 | current | 无 |
| R-017 | D-024 | FR-FORMAT-001~004 | current | 无 |
| R-018 | D-026 | FR-REBIND-001~004 | current | 无 |
| OI-01 | D-001 | FR-GOV-001 / AC-GOV-001 | current | 无 |
| OI-02 | D-002 | FR-GOV-006 / AC-GOV-006 | current | 无 |
| OI-03 | D-003 | FR-GOV-009 / AC-GOV-009 | current | 无 |
| OI-04 | D-004 | FR-WAIT-001/002 / AC-WAIT-001/002 | current | 例外清单第 2 条 |
| OI-05 | D-005 | FR-CLEANUP-005 / AC-CLEANUP-005 | current | OPEN-002 口径调和 |
| OI-06 | D-006 | FR-GOV-009 / AC-GOV-009 | current | 无 |
| OI-07 | D-007 | FR-GOV-010 / AC-GOV-010 | current | 无 |
| OI-08 | D-008 | FR-GOV-007 / AC-GOV-007 | current | 无 |
| OI-09 | D-009 | FR-GOV-009 / AC-GOV-009 | current | 无 |
| OI-10 | D-010 | FR-CLEANUP-002 / AC-CLEANUP-002 | current | 无 |
| OI-11 | D-011 | FR-CLEANUP-005 / AC-CLEANUP-005 | current | OPEN-001 已在 spec 闭合 |
| OI-12 | D-012 | FR-CLEANUP-001 / AC-CLEANUP-001 | current | 无 |
| OI-13 | D-013 | FR-CLEANUP-003、FR-GOV-005 / AC-CLEANUP-003、AC-GOV-005 | current | 无 |
| OI-14 | D-014 | FR-GOV-002 / AC-GOV-002 | current | 无 |
| OI-15 | D-015 | FR-GOV-004 / AC-GOV-004 | current | 无 |
| OI-16 | D-016 | FR-GOV-005 / AC-GOV-005 | current | 无 |
| OI-17 | D-017 | FR-GOV-008 / AC-GOV-008 | current | 无 |
| OI-18 | D-018 | FR-GOV-003 / AC-GOV-003 | current | 无 |
| OI-19 | D-019 | FR-HEALTH-001/002 / AC-HEALTH-001/002 | current | 3rd-review 侧验收单独登记 |
| OI-20 | D-020 | FR-CLEANUP-004 / AC-CLEANUP-004 | current | 例外清单第 1 条 |
| OI-21 | D-021 | FR-BINDING-001/002 / AC-BINDING-001/002 | current | 无 |
| OI-22 | D-022 | FR-PREFLIGHT-001/002/003 / AC-PREFLIGHT-001/002/003 | current | 例外清单第 3 条 |
| OI-23 | D-023 | FR-HEALTH-002/003/004、FR-BROKER-001/002 / AC-HEALTH-002/003/004、AC-BROKER-001/002 | current | 例外清单第 4、7、10 条 |
| OI-24 | D-024 | FR-FORMAT-001~004 / AC-FORMAT-001~004 | current | 例外清单第 5、8 条 |
| OI-25 | D-025 | FR-BROKER-003/004 / AC-BROKER-003/004 | current | 例外清单第 6 条、OPEN-004 |
| OI-26 | D-026 | FR-REBIND-001~004 / AC-REBIND-001~004 | current | 例外清单第 9 条 |

## 1. 问题与紧迫性

workflowhub 干活又慢又费钱，且用户已用一手数据证实：上一轮 72 次 provider attempt 中 24 次失败（33%），其中 12 次是 antigravity 在约 5 分钟处被内部超时截断后伪装成「模型无输出」；单轮审查最长空等 20 分钟，已完成却仍白等、不可用审查被复用钉死；一次收口命令耗时 67.4 分钟（其中主会话空等 62.7 分钟），同一窗口写 164 个文件、同一句话被重复确认 4 次、交互聚合重发 3 次；证据发布仍强制全量重采；一个无生产消费者的 15 分钟私有记录锁仍在；check-skill-closure 与 smoke-local-skill-dispatch 两个检查长期红灯；DEF-01~DEF-07 延期项悬置未处置。

为什么现在必须处理：用户在 make-decision 阶段已逐条定案 26 条 OI 并授权跨仓最小修复边界；每再拖一个收口窗口，就会再重演一次「材料写入 → 确认失效 → 重复确认与聚合 → 164 个文件」的实测级联（RK-11 的对照基线）。修复只允许根因级、净减或持平，禁止再加一层统计或采集。

## 2. 背景、目标与范围

### 背景

workflowhub 是纯 CLI 的 AI 开发工作流编排工具（零页面），审查能力由本仓 wh-review 技能与外部仓 3rd-review 协作完成。五阶段流程与人工确认点是正常工作方式（D-001）。本任务的全部根因定位已由 make-decision 阶段用只读手段完成：空等根因在外部仓 broker 的全员终态才发布 group；antigravity 失败根因是 agy 1.2.4 超时行为变更叠加 3rd-review 适配器三项缺陷，本仓 request schema 不消费 --print-timeout，无法透传，正确根修只能落在 3rd-review（用户 talk-round-4 授权）。

### 目标

- 消除四类浪费的根因：审查空等（到期前终态复检 + 复用守卫）、antigravity 型假失败（根修 + 健康检测 + 预检）、证据重采残留（去强制全量重采 + 删死代码）、收口重绑级联（三阶段同批治理，同一次收口只发生一次确认与一次聚合）。
- 两个红灯转绿且不劣化基线；DEF-01~DEF-07 逐条判取消并写入延期文件；DEF-08/DEF-09 定义并在本任务内闭合 DEF-09。
- 每条修复只认可观察行为、行数事实、命令退出码与 acceptance_criterion facts 账本（OI-07/OI-14）。

### 范围内

- 审查等待侧组合拳、provider 根修（3rd-review 授权 6 文件清单内）、派发前预检扩展、审查中健康检测（非终态成员级事实）、输入输出格式宽容（甲/乙/丙）、两轨质量事实绑定修正、attempt 公开事实一致性、重采残留清理、记录锁净减删除、哈希基线对齐、收口重绑级联治理（F1/F2、D1、D2、D3、D4）、延期文件更新。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

### SCN-001：多 provider 审查正常完成（默认态）

- **角色**：workflowhub 用户（CLI 操作者）
- **Given**：材料齐备，预检全部通过，多 provider 可用
- **When**：发起一次 wh-review 审查
- **Then**：各 provider 完成审查，findings 落在真实材料行，聚合 closed；本次方向审查实测墙钟 5 分 50 秒、detail 审查 6 分 59 秒，未触发 20 分钟上限，可作对照基线

### SCN-002：operation 已终态但轮询未察觉（加载态边界）

- **角色**：workflowhub 用户
- **Given**：一次审查的 operation 实际已进入 terminal，但本仓等待侧轮询尚未察觉
- **When**：等待接近 20 分钟上限
- **Then**：到期前先做一次终态复检，已 terminal 就直接消费结果，不再空等到上限

### SCN-003：审查超时且零 provider attempt（空态）

- **Given**：一次审查落 REVIEW_WAIT_EXCEEDED 且 provider_attempts 为 0（不可用审查）
- **When**：同一 key 再次发起审查请求；随后以显式 judged retry 再发
- **Then**：新请求不得复用该不可用审查（不被钉死）；显式 judged retry 仍被放行可用

### SCN-004：antigravity 内部超时伪装成模型无输出（错误态）

- **Given**：agy 内部 --print-timeout 到期，进程退出码 0、stdout 全空、stderr 恰好 79 字节 print timeout 警告
- **When**：该结果经 3rd-review 适配器与 broker 归组
- **Then**：产出可区分的超时事实（PROVIDER_PRINT_TIMEOUT），被识别为超时类并纳入重发，绝不再被归为「emitted no final text」

### SCN-005：有问题的 provider 在派发前被拦下（边界态）

- **Given**：host_provider 取非法值（如 claude，不在 3rd-review SUPPORTED_PROVIDER_IDS 内），或 model id 不存在、CLI 不可执行、认证形状非法、活性探测失败
- **When**：发起审查
- **Then**：在 buildBundle、加锁、dispatch 之前落 blocked_before_dispatch，provider_attempts 为 0

### SCN-006：审查中成员进入明确失败态（错误态即时可见）

- **Given**：一次 managed 审查中某成员进入明确失败态（如 agy print timeout）
- **When**：等待中的轮询读取当前信封
- **Then**：非终态信封暴露该成员 status、error.code、last_progress_at_ms，本仓立即得到可判定事实并停止或重发，不必等满 20 分钟；健康但慢的成员不被误杀

### SCN-007：成员输出里出现一个路径（误杀修复）

- **Given**：组成员审查输出 prose 里出现一个 /xxx 路径，或普通 broker 失败的 message 含路径
- **When**：结果公开与读取
- **Then**：只 fail 越界成员、组记 partial，路径检查只扫结构化路径字段；broker 失败脱敏后保留原 code 并附 cause_code

### SCN-008：异源 provider 输出格式不标准（格式宽容）

- **Given**：provider 返回 JSONL、多围栏且唯一含 findings、被包在更大对象、顶层多余键、severity 同义别名之一
- **When**：输出解析与非终态信封校验
- **Then**：宽容解析后仍取得 findings；非终态信封忽略额外键但保留必需 5 键；7 条红线样本的行为与改前逐项一致

### SCN-009：只发布单一轨道的 review receipt（质量事实绑定）

- **Given**：一次 execute 只提交 direction receipt（detail 未运行）
- **When**：runtime 派生 review 质量事实
- **Then**：direction_review 事实绑 direction result；不产生 subject=detail_review 的 recorded 事实；detail 轨真实运行时正常记录

### SCN-010：收口窗口的材料写入与确认有效性（竞态）

- **Given**：同一次收口中需要写 stage 事实（只落 task store）或合法改写 tasks.md 执行状态填写区
- **When**：已发布的人工确认与交互聚合面临材料修订变化
- **Then**：同一次收口 confirm 发布恰 1 次、交互聚合发布恰 1 次；仅执行记录区改写或仅非材料快照变化时既有确认仍命中；decision-log.md 的实质改动仍使确认失效

### SCN-011：治理边界逐条可核验

- **Given**：本任务全部改动形成的 diff 与材料
- **When**：对照非目标清单、净减或持平约束、例外清单 10 条、写入面事实
- **Then**：不出现人工确认点改动、采集面、archive 字节改动、3rd-review 越界写入；两红灯 exit 0

### SCN-012：跨仓写入授权边界（权限态）

- **Given**：本任务需要修复 antigravity 与健康检测
- **When**：对 3rd-review 仓动手
- **Then**：写入逐条落在授权清单 6 文件内（lib/adapters/antigravity.mjs、lib/provider-failure.mjs、lib/recovery-policy.mjs、lib/broker.mjs、lib/workflowhub-result-v3.mjs、test/managed-session-lifecycle.test.mjs 守卫测试），该仓其余文件与两个 config 文件不动

### 状态覆盖清单

- [x] **默认态**：SCN-001
- [x] **空态**：SCN-003（零 provider attempt 的不可用审查）
- [x] **错误态**：SCN-004、SCN-006、SCN-007
- [x] **加载态**：SCN-002（等待中的到期前终态复检）
- [x] **取消态**：N/A — 本任务明确不接通 cancelManaged（D-010），审查取消不在范围
- [x] **边界态**：SCN-005（派发前拦截边界）、SCN-008（格式宽容边界）、SCN-010（确认失效边界）
- [x] **权限态**：SCN-012（跨仓授权边界）
- [x] **竞态**：SCN-010（材料写入与确认有效性竞态）

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：审查空等的根因在外部仓 broker——managedPublic 只在全员终态才发布 group，本仓只能改等待侧
  - **status**：verified
  - **证据或来源**：decision-log.md OI-03/OI-04 处置；3rd-review/lib/broker.mjs:160-163、:801；skills/wh-review/scripts/simple-review-runner.mjs:40、529、533-539
  - **关联**：FR-WAIT-001、FR-WAIT-002、AC-WAIT-001、AC-WAIT-002

- **PFACT-002**：20 分钟阈值（1_200_000 ms）是当前值，现场无任何合法审查时长分布支持改动
  - **status**：verified
  - **证据或来源**：decision-log.md OI-04 定案与 RK-6；simple-review-runner.mjs:40
  - **关联**：FR-WAIT-001、AC-WAIT-001、FR-GOV-003

- **PFACT-003**：agy 1.2.4 在内部 print-timeout 到期时改为退出码 0 + stdout 全空 + stderr 一句 partial-output 警告，把超时截断伪装成「模型无输出」
  - **status**：verified
  - **证据或来源**：decision-log.md ## 调研 antigravity 硬证据表；12 次失败 stderr 逐字相同（79 字节）、stdout 哈希为空串 sha256、失败与成功耗时零重叠、--print-timeout 2s 最小复现逐字节一致
  - **关联**：FR-HEALTH-001、FR-HEALTH-002、FR-HEALTH-004、AC-HEALTH-001、AC-HEALTH-002、AC-HEALTH-004

- **PFACT-004**：3rd-review 的 antigravity 适配器有三项缺陷——argv 未设 --print-timeout、parse 只看 stdout 忽略 stderr、空 stdout 被归为 PROVIDER_OUTPUT_INVALID
  - **status**：verified
  - **证据或来源**：decision-log.md OI-19 处置；3rd-review/lib/adapters/antigravity.mjs:6-9、:19
  - **关联**：FR-HEALTH-001、AC-HEALTH-001

- **PFACT-005**：wh-review 的 request schema 不消费 --print-timeout，CLI 参数固定，agy 无对应环境变量，本仓无法透传，正确根修只能在 3rd-review
  - **status**：verified
  - **证据或来源**：decision-log.md ## 调研 归属裁定与 talk-round-4 授权；review-provider-client.mjs:901
  - **关联**：FR-HEALTH-001、FR-GOV-007、AC-HEALTH-001、AC-GOV-007

- **PFACT-006**：15 分钟记录锁的唯一实体无生产消费者，wh-review-cli.mjs:877 自述 Not reachable from the public CLI
  - **status**：verified
  - **证据或来源**：decision-log.md OI-10 处置；git grep runTaskBoundE2eReview 仅定义与测试引用
  - **关联**：FR-CLEANUP-002、AC-CLEANUP-002

- **PFACT-007**：历史断言「证据重采重跑 8 次 / 合计 37.9 分钟」全仓无可复核原件，只能证明至少重跑 2 次
  - **status**：verified
  - **证据或来源**：decision-log.md OI-06 处置与 RK-7；canonical-receipt-writer.mjs:344-347、stage-runner.mjs:1791-1801、review-record-route.mjs:548-552 现场复核
  - **关联**：FR-CLEANUP-001、FR-GOV-009、AC-GOV-009

- **PFACT-008**：本任务收口窗口实测 67.4 min（空等 62.7 min / 13 次 sleep），窗口内写 164 个文件（占全 task store 356 的 46%），confirm 发布 4 次、交互聚合 3 次、材料 draft 3 次
  - **status**：verified
  - **证据或来源**：decision-log.md ## 需求权威更新（用户裁定，2026-09-17 增量决策）实测时间线与重复次数表；quality/confirmations 四份原件
  - **关联**：FR-REBIND-001~004、AC-REBIND-001~004

- **PFACT-009**：provider 失败一手分布——33 attempt / 72 provider attempt / 24 failed / 493 provider-分钟；antigravity/flash ok2/fail12 且 12 次全为 PROVIDER_OUTPUT_INVALID
  - **status**：verified
  - **证据或来源**：decision-log.md ## 调研 根因定位一手数据；失败码合计 31 与 24 failed 的口径差异登记为 OPEN-002
  - **关联**：FR-CLEANUP-005、AC-CLEANUP-005

- **PFACT-010**：3rd-review 的 projectStatus 已含 providers[id].status / error.code / last_progress_at_ms，是现成但对 managed 运行不可达的载体
  - **status**：verified
  - **证据或来源**：decision-log.md OI-23 处置；3rd-review/lib/broker.mjs:617-624
  - **关联**：FR-HEALTH-003、AC-HEALTH-003

- **PFACT-011**：协议约束「非终态不得带 group」现由 assertManagedPublic 强制执行，测试守卫 3rd-review/test/managed-session-lifecycle.test.mjs:58-71（:76 断言 terminal 才带 group）
  - **status**：verified
  - **证据或来源**：decision-log.md OI-23 处置；3rd-review/lib/broker.mjs:169；skills/wh-review/scripts/review-provider-client.mjs:593-600
  - **关联**：FR-HEALTH-003、AC-HEALTH-003

- **PFACT-012**：review 质量事实错绑机制——缺轨时回落到 evidence_refs 首条 quality/reviews/results 引用且不校验 review_track，导致两轨事实互指
  - **status**：verified
  - **证据或来源**：decision-log.md OI-21 处置与 step 10 实测；stage-runner.mjs:1595、:1638-1643、:1693-1753
  - **关联**：FR-BINDING-001、FR-BINDING-002、AC-BINDING-001、AC-BINDING-002

- **PFACT-013**：9 条 antigravity 失败记录里 attempts[0] 记 status completed 与 error null——broker 在 parse 之前用进程级 ok 写入，公开 attempt 事实与实际失败不一致
  - **status**：verified
  - **证据或来源**：decision-log.md OI-25 处置；3rd-review/lib/broker.mjs:1063
  - **关联**：FR-BROKER-003、FR-BROKER-004、AC-BROKER-003、AC-BROKER-004

- **PFACT-014**：成员级 hasPrivatePath 扫成员 output 原文，一条 finding 里一个 /xxx 就让该成员完整输出被整体替换为 PUBLIC_RESULT_INVALID，现场 8 次误杀；组级再对整组扫一遍使一个成员 prose 路径让整次读取失败
  - **status**：verified
  - **证据或来源**：decision-log.md OI-24 甲类处置；3rd-review/lib/workflowhub-result-v3.mjs:169、:185；lib/broker.mjs:454-475
  - **关联**：FR-FORMAT-001、AC-FORMAT-001

- **PFACT-015**：宿主路径脱敏正则字符集不含 CJK 标点，路径后紧跟的中文被吞进脱敏片段，现场复现 host-path-redacted 24 次、总字节 -1196、取消理由：消失、DEF-01 计数 20→19
  - **status**：verified
  - **证据或来源**：decision-log.md OI-24 甲类处置与附带发现；review-materials.mjs:426
  - **关联**：FR-FORMAT-002、AC-FORMAT-002

- **PFACT-016**：本任务对 3rd-review 的写入授权仅限 6 文件清单（antigravity 适配器 A+B、provider-failure、recovery-policy、broker 四处目的、result-v3、test/managed-session-lifecycle.test.mjs 守卫测试），该仓其余文件、两个 config 文件、派发数量均不动
  - **status**：verified
  - **证据或来源**：decision-log.md ## 需求权威更新 grill-G2 第 5 条授权改动清单＋用户本轮扩展授权裁定（授权清单第 6 文件、例外清单第 10 条）
  - **关联**：FR-HEALTH-001~003、FR-BROKER-001~003、FR-FORMAT-001、FR-GOV-007、AC-GOV-007

- **PFACT-017**：静态预检原理上发现不了 antigravity 这类运行时失败（agy 内部 5 分钟到期 → 退出码 0 + 空 stdout），该缺口只能由审查中健康检测承接
  - **status**：inferred
  - **证据或来源**：decision-log.md OI-22 处置的机理分析（agy 进程层面一切正常）；限制：该结论基于 agy 1.2.4 当前行为
  - **关联**：FR-PREFLIGHT-003、AC-PREFLIGHT-003、FR-HEALTH-003

- **PFACT-018**：确认身份用全局 material_revision + snapshot_tree，范围另有更窄的 material_scope；build-spec 失败点在读侧实时重算（stage-runner.mjs:3057），build-plan 失败点在范围最宽 + 下游合法改写 tasks.md 执行状态填写区
  - **status**：verified
  - **证据或来源**：decision-log.md 增量决策节四个不同坏点；task-kernel-implementation.mjs:952-953、:976-983、:913-921；completion-predicates.mjs:27、:31
  - **关联**：FR-REBIND-003、FR-REBIND-004、AC-REBIND-003、AC-REBIND-004

- **PFACT-019**：HEAD 基线两个红灯——check-skill-closure exit 1（多条 bundle sha256 mismatch）、smoke-local-skill-dispatch exit 1（SKILL_RESOLUTION_FAILED），真实漂移为 3 skill / 4 文件 + 5 条 catalog local_bundle_hash，引入提交 25b44430
  - **status**：verified
  - **证据或来源**：decision-log.md OI-15/OI-20 处置；两检查在同一 HEAD 主仓独立复现
  - **关联**：FR-CLEANUP-004、FR-GOV-004、AC-CLEANUP-004、AC-GOV-004

- **PFACT-020**：本任务验收只认可观察行为、行数事实、命令退出码三类对象，质量账本只认 acceptance_criterion facts 一种
  - **status**：verified
  - **证据或来源**：decision-log.md OI-07/OI-14 定案；## 审查处置第 8 项
  - **关联**：FR-GOV-010、AC-GOV-010

## 5. 功能需求

### 审查等待域（WAIT）

等待侧只解决「白等」与「被钉死」两件事，不碰 20 分钟阈值数字。用户在 talk-round-3 明确选定不改这个数字，现场也没有任何合法审查时长分布可作为新阈值依据。

- **FR-WAIT-001**：等待侧在 20 分钟上限到期前先做一次终态复检；operation 已 terminal 就直接消费其结果，消除「已完成却白等」
  - **范围边界**：只加复检动作与直接消费路径；不改阈值、不接 cancelManaged（D-010 否决）
  - **依据**：D-004、PFACT-001、PFACT-002
  - **场景**：SCN-002
  - **验收**：AC-WAIT-001

- **FR-WAIT-002**：落 REVIEW_WAIT_EXCEEDED 且 provider_attempts 为 0 的不可用审查不得被 findReusableReview 当作可复用审查；显式 judged retry 仍可用，不得产生永久不可重试的不可用审查
  - **范围边界**：只堵复用守卫这一个副作用；重试准入判据（material_changed 等）不动
  - **依据**：D-004、PFACT-001
  - **场景**：SCN-003
  - **验收**：AC-WAIT-002

### provider 健康域（HEALTH）

antigravity 根修按用户 talk-round-4 与 grill-G2 授权落在 3rd-review 授权清单内；本仓不得加缓解层、不得改配置、不得减少派发。超时在适配器层暴露诚实码，在 broker 归类层进入重发，两层映射写明（处置 detail 轨 D6：两名并存按层映射，不二选一删名）。

- **FR-HEALTH-001**：3rd-review 的 antigravity 适配器做两处最小修复——argv 增加 --print-timeout 20m（+1 数组元素、0 行净增）；parse 改为读 stdout 与 stderr，stderr 命中 print timeout 警告时返回诚实的 PROVIDER_PRINT_TIMEOUT
  - **范围边界**：仅限授权文件 lib/adapters/antigravity.mjs 的 A+B 两处；3rd-review 侧改动与验收单独登记，不计入本仓通过判据
  - **依据**：D-019、PFACT-003、PFACT-004、PFACT-005、PFACT-016
  - **场景**：SCN-004
  - **验收**：AC-HEALTH-001

- **FR-HEALTH-002**：agy 的 print timeout stderr 串在 provider-failure 层被识别为超时类失败（不再误归 PROCESS_EXIT_NONZERO）；recovery-policy 把 PROCESS_TIMEOUT 纳入可重发表；适配器诚实码 PROVIDER_PRINT_TIMEOUT 与 broker 归类码 PROCESS_TIMEOUT 的层间映射在材料中写明
  - **范围边界**：仅限授权文件 lib/provider-failure.mjs 与 lib/recovery-policy.mjs；不改其它适配器与 broker 策略
  - **依据**：D-023、PFACT-003、PFACT-016
  - **场景**：SCN-004、SCN-006
  - **验收**：AC-HEALTH-002

- **FR-HEALTH-003**：非终态信封暴露成员级真实事实（成员 status、error.code、last_progress_at_ms）；本仓等待侧轮询改为消费这些事实，成员进入明确失败态时立即得到可判定结果，不必等满 20 分钟；协议约束「非终态不得带 group」按用户授权演进，守卫测试 3rd-review/test/managed-session-lifecycle.test.mjs:58-71 同批改到新边界并写明理由（授权依据＝用户 G2-impl 选项原文＋用户本轮扩展授权「扩展授权：加入该守卫测试文件」，该测试为授权清单第 6 个文件、登记例外清单第 10 条），只放宽非终态携带成员级真实事实，不放宽成员级必需键与 fail-closed 行为
  - **范围边界**：BR 侧限授权文件 lib/broker.mjs 与 lib/workflowhub-result-v3.mjs 对应目的；WH 侧限轮询消费与镜像校验；属跨仓新增公开面，单独登记验收
  - **依据**：D-023、PFACT-010、PFACT-011、PFACT-016
  - **场景**：SCN-006
  - **验收**：AC-HEALTH-003

- **FR-HEALTH-004**：「真卡死」与「健康但慢」必须可区分，抓手为 agy stderr 的 print timeout 串（PROCESS_TIMEOUT 类）与成员 last_progress_at_ms 的组合事实；判定口径写清——stalled＝成员 error.code 已置位或 provider 自报超时（agy stderr print timeout 串），slow-but-healthy＝预算内仍有进度（last_progress_at_ms 推进、无错误码）；对无自报信号的真卡死成员，中止路径仍走既有 20 分钟上限 + OI-04 到期前终态复检，不新造判死信号；健康但慢的成员不被误杀；成员级事实（status/error.code/last_progress_at_ms）只披露供消费方判断，完整 broker 状态机（成员 failed/stalled/slow/retried/partial/terminal 的转换与动作矩阵）不在本 spec 范围——决策拒绝新增控制面
  - **范围边界**：只做事实披露与消费，不自造墙钟判死（D-030③ 红线不动）；不新增状态机、不新增重试预算或仲裁语义（超出决策授权，净减原则）
  - **依据**：D-023、PFACT-003、PFACT-017
  - **场景**：SCN-006
  - **验收**：AC-HEALTH-004

### broker 重发与 attempt 事实域（BROKER）

重发的三个甲级 bug 让全部阶段的 single_round/full_only 重发被关着、无 resume 时静默 no-op、失败 attempt 被误记 completed；三者同属授权文件 lib/broker.mjs。

- **FR-BROKER-001**：lib/broker.mjs 放行 single_round 与 full_only 各一次 fresh_execution 重发（修正 :1118-1120 把这两模式排除在重发外的判定）
  - **范围边界**：只修该判定点；重发次数上限不变
  - **依据**：D-023、PFACT-016
  - **场景**：SCN-006
  - **验收**：AC-BROKER-001

- **FR-BROKER-002**：same_session_repair 在无 resume 可用时降级为 fresh_execution（修正 :1124-1125 只实现 fresh_execution 导致的静默 no-op）
  - **范围边界**：只补降级路径；antigravity 的 resume 抛错行为不动
  - **依据**：D-023、PFACT-016
  - **场景**：SCN-006
  - **验收**：AC-BROKER-002

- **FR-BROKER-003**：attempt 公开事实以 parse 结果为准（修正 :1063 在 parse 之前用进程级 ok 写入），事后可归因区分进程失败与解析失败
  - **范围边界**：只修写入判定顺序与归因；不删历史 provenance 记录
  - **依据**：D-025、PFACT-013、PFACT-016
  - **场景**：SCN-004
  - **验收**：AC-BROKER-003

- **FR-BROKER-004**：runtime/review/schemas/attempt.schema.json 为新增持久字段登记（属性表放宽 additionalProperties 并补字段），并修掉 review-result.mjs:84-87 写 execution 字段直接抛 TypeError 的缺口；新增字段契约（字段名/类型/枚举/生产者/消费者/删除条件，登记要求见例外清单第 6 条）——①`process_outcome`：string 枚举 ["ok","exit_nonzero","timeout","launch_failure"]，记录进程级结果，生产者＝3rd-review broker 的 attempt 写入点（BR 侧随公开事实携带），唯一 consumer＝WH 失败归因与重发分类（review-result 归因路径），owner＝wh-review 审查链路，删除条件＝BR 公开事实把进程结果并入既有 status 枚举且 WH 无独立消费方；②`parse_outcome`：string 枚举 ["ok","invalid","empty_output"]，记录解析级结果，生产者＝解析阶段（BR parse 判定 + WH review-result 写入），唯一 consumer、owner、删除条件同①；两字段组合使「进程失败」与「解析失败」事后可归因区分（D-025）；迁移兼容：本任务为 vNext 新 task，attempt 记录内容寻址、只增不改，历史 attempt 无旧数据迁移、按 provenance 只读保留
  - **范围边界**：只登记本任务需要的字段；不复活 quality-verify.v1 等已删持久对象
  - **依据**：D-025、PFACT-013
  - **场景**：SCN-004
  - **验收**：AC-BROKER-004

### 派发前预检域（PREFLIGHT）

预检由「仅静态可判定必败项」扩到 provider 身份与活性校验，红线 F-017② 与延期项⑥ 按用户裁定在材料中写明修订依据与范围。预检仍位于 buildBundle/runGroup 之前，不引入第二个 elapsed-time timer。

- **FR-PREFLIGHT-001**：host_provider 合法性校验纳入预检——third-review-host-config.mjs 的 adapterOf 由只做正则升级为对照 3rd-review SUPPORTED_PROVIDER_IDS 白名单；非法值在 buildBundle、加锁、dispatch 之前落 blocked_before_dispatch 且 provider_attempts 为 0
  - **范围边界**：只加白名单校验；不减少任何 provider 的派发
  - **依据**：D-022、PFACT-016、PFACT-017
  - **场景**：SCN-005
  - **验收**：AC-PREFLIGHT-001

- **FR-PREFLIGHT-002**：model id 校验、CLI 可执行性校验、认证校验、活性探测四项纳入预检，各附针对性测试；四项均在派发前拦下有问题的 provider，真值来源与失败码定死——①model id：真值来源为 provider CLI 的模型清单（antigravity 系为 `agy models`，其余适配器为各自等价模型清单命令），不在清单内即拦，失败码 MODEL_ID_INVALID；②CLI 可执行性：对适配器命令做存在性 + X_OK 探测（与既有 claude-code beforeSpawn 探针同口径），失败码 CLI_UNAVAILABLE；③认证：按 3rd-review config 的 auth 形状（native/env 类型 + env 型必需环境变量存在性）校验，失败码 AUTH_INVALID；④活性探测：轻量起答探测（`--version` 级）确认进程可起可答，失败码 ACTIVE_PROBE_FAILED；单 provider 被拦＝跳过该 provider 并留 blocked 事实；同组全部被拦＝本次请求在 dispatch 前失败；四项预检全部位于既有 buildBundle/runGroup 之前
  - **范围边界**：model id 不再当不透明串；活性探测不替代审查中健康检测；不新增 config 键、不新增第二个 elapsed-time timer（决策边界）；各探测命令的超时与失败形状在 build-plan/build-code 按既有预检惯例定死并附测试
  - **依据**：D-022、PFACT-017
  - **场景**：SCN-005
  - **验收**：AC-PREFLIGHT-002

- **FR-PREFLIGHT-003**：预检能力边界在材料中写明——antigravity 型运行时失败（进程退出码 0、空 stdout）静态预检原理上抓不到，由审查中健康检测承接；不宣称预检可拦截运行时失败
  - **范围边界**：只写边界声明，不加新机制
  - **依据**：D-022、PFACT-017
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-PREFLIGHT-003

### 格式宽容域（FORMAT）

按甲/乙/丙三类落地：甲类修实现 bug，乙类做格式宽容，丙类 7 条红线原样保留。宽容只作用于格式解析与信封键容忍，审查标准一条不降。

- **FR-FORMAT-001**：甲类实现 bug 修复——成员级路径越界不连坐全组（只 fail 越界成员、组记 partial，路径检查限定结构化路径字段而不扫成员 output 原文）；safeBrokerError 脱敏保原 code 并附 cause_code；simple-review-runner.mjs:1315 空 catch 不再吞真实 parse 错；PHASE_DIFF_MAX_DELIVERY_BYTES 零消费者死常量删除；WH_REVIEW_TRUNCATED_SECTION 标记覆盖所有丢段路径
  - **范围边界**：甲类逐条修，不碰任何 fail-closed 红线
  - **依据**：D-024、PFACT-014
  - **场景**：SCN-007
  - **验收**：AC-FORMAT-001

- **FR-FORMAT-002**：redactProviderHostPaths 的 LOCAL_HOST_PATH 正则字符集收紧（review-materials.mjs:426），使路径后紧跟的 CJK 正文不被吞入脱敏片段；只收紧字符集与边界，不改告警后采用的 fail-closed 行为
  - **范围边界**：只修该正则；属新增边界分支，登记例外清单第 8 条
  - **依据**：D-024、PFACT-015
  - **场景**：SCN-007
  - **验收**：AC-FORMAT-002

- **FR-FORMAT-003**：乙类格式宽容——审查输入剥可选 bundle/ 前缀、逐条 anchor verdict 只丢越界条而不整员失败；输出解析容忍 JSONL、多围栏取唯一含 findings 者、被包在更大对象时的提取、顶层多余键、severity 同义别名；非终态信封忽略额外键但保留必需 5 键；确定性抽取规则已定死（闭合 OPEN-003）——候选形态按优先级降序取 findings：①JSONL（每行一个 JSON 对象，取所有可解析行）＞②单个 fence 内的 JSON（取唯一含 findings 键的围栏）＞③首个可解析 JSON 候选；被包在更大对象时提取其内嵌 findings 值；severity 别名归一映射表：blocking←{blocker, critical, fatal}、major←{important, moderate, warning, significant}、minor←{nit, trivial, suggestion, info, note}；无法归一的 severity 只丢该条 finding（不整员失败）；全部形态均无可解析候选时该成员落结构化 OUTPUT_INVALID 并附 parse 错误事实（不静默吞错）
  - **范围边界**：只放宽解析与键容忍；不新增甲/乙类之外的宽容级别，不碰丙类 7 条红线；多候选歧义按上述优先级确定性消解，不再遗留待 build-plan 开放的抽取问题
  - **依据**：D-024
  - **场景**：SCN-008
  - **验收**：AC-FORMAT-003

- **FR-FORMAT-004**：丙类 7 条红线原样保留——私有/宿主路径 fail-closed、finding 落真实材料与真实行号、minimum_heterologous/quorum、材料允许清单与固定指令模板、材料身份与选择绑定、信封/组/成员必需键、非 minor finding 必须有 evidence_kind/evidence/root_cause
  - **范围边界**：7 条红线可 diff 验证未被改动；反向断言（review-output.mjs 顶层键校验与 review-provider-client-v3 测试 :384、:391-399）的修改写明理由与新边界
  - **依据**：D-024、PFACT-014
  - **场景**：SCN-008
  - **验收**：AC-FORMAT-004

### 质量事实绑定域（BINDING）

只发布 direction review 时 runtime 写出 detail_review recorded 事实的谎报，根因是缺轨回落 evidence_refs 首条且不校验 review_track；修触发条件，不允许只删记录掩盖。

- **FR-BINDING-001**：direction 与 detail 两轨 review 质量事实各自绑定本轨 result（direction_review→direction result、detail_review→detail result）；某一轨没有本轨 result 时不得回落到另一轨 result，evidence_refs 首条回落逻辑移除
  - **范围边界**：只修 stage-runner.mjs:1595 回落、:1638-1643 取首条、:1693-1753 不校验 track 的触发条件
  - **依据**：D-021、PFACT-012
  - **场景**：SCN-009
  - **验收**：AC-BINDING-001

- **FR-BINDING-002**：修复后 quality/facts 中同一 review subject 的 current 事实不得并存两条指向不同 result 的冲突事实
  - **范围边界**：以修触发条件为准；历史错绑记录按 provenance 保留、不参与当前判定，不用摘要覆盖来源
  - **依据**：D-021、PFACT-012
  - **场景**：SCN-009
  - **验收**：AC-BINDING-002

### 清理与基线域（CLEANUP）

只做真实残留修复与净减删除；每条给出逐文件行数；除例外清单 10 条外净减或持平。

- **FR-CLEANUP-001**：证据重采残留修复——去掉 assertVNextSourceStable 的 {fresh:true} 强制全量重采×2（stage-runner.mjs:1792 两处）；删除 freshness.mjs:269-288 的 bindFreshness/assertFresh 死代码及 3 处测试引用；发布前后源稳定性防护仍由既有材料 revision/hashes 检查（stage-runner.mjs:2508-2511）承担；改动有针对性测试覆盖（OI-12 acceptance）
  - **范围边界**：不做受影响接缝映射表，不做 verify-code 整树守卫收窄
  - **依据**：D-012、PFACT-007
  - **场景**：SCN-011
  - **验收**：AC-CLEANUP-001

- **FR-CLEANUP-002**：15 分钟记录锁净减删除——删 runTaskBoundE2eReview 函数本体、专属锁、仅服务它的私有导出与测试（wh-review-cli.mjs 侧）；删除前完成全仓 consumer 扫描（含测试与工具引用）与安全不变式证明，结果写入材料；行数净减
  - **范围边界**：删到零；若最终保留则必须在材料中给出真实生产消费者（实测没有）
  - **依据**：D-010、PFACT-006
  - **场景**：SCN-011
  - **验收**：AC-CLEANUP-002

- **FR-CLEANUP-003**：DEF-09 闭合——构建期删除 tests/e2e/ui-e2e-contract-dogfood.test.mjs:223 残留的 quality-verify.v1 字面量（位于 it.skip 内部），活动命中数降为 0，受影响测试 GREEN
  - **范围边界**：只删该残留字面量；不复活 quality-verify 对象图
  - **依据**：D-013
  - **场景**：SCN-011
  - **验收**：AC-CLEANUP-003

- **FR-CLEANUP-004**：两个红灯修复按 C1 落地——重新对齐声明哈希，枚举为 4 个声明文件 9 行值替换、净 0：skills/spec-analyze/skill-bundle.json 2 行（SKILL.md 与 packet-lens.md 各 1 条 sha256 声明）、skills/stage-handoff/skill-bundle.json 1 行、skills/stage-reflection/skill-bundle.json 1 行、skills/catalog.yaml 5 行（local_bundle_hash 值）；补回同一提交从 5 个 workflows/<stage>/SKILL.md 删掉的 outcome 披露措辞（约 +10 行），材料写明接受 25b44430 已合入字节为基线；同步重算 wh-review bundle 与 catalog 哈希（RK-5）；tests/contract/stage-reflection-wiring.test.mjs:143 第三条回归闭合（OI-20 acceptance ③）。注：decision-log D-020/OI-20 原文记「8 文件 9 行值替换」，其自身枚举即上述 4 文件；该计数不一致已登记为 detail 轨 D17（未决项注记：实现细节层、处置权归 build-spec/build-code），本 spec 以逐文件枚举清单为准
  - **范围边界**：不回退内容、不修正比较口径；C2/C3 已被硬反例否决
  - **依据**：D-020、PFACT-019
  - **场景**：SCN-011
  - **验收**：AC-CLEANUP-004

- **FR-CLEANUP-005**：provider 失败率本仓可控修复——三条实现 bug（统一 provider 路径口径并改正 prompt 样例、补齐失败分类表 review-result.mjs:144-170、身份降级不覆盖真因 message）；源漂移止损只在源漂移事实成立时触发（依据事实而非墙钟计时），具体行为按 detail-D7 与 OI-10 否决理由合并陈述定死——轮询回检发现源漂移事实成立时：①立即中止本轮等待轮询，不再等满时限；②该 attempt 记为 failed 并给出结构化 error.code=REVIEW_SOURCE_DRIFT（OI-05 失败分类表已列此码）与漂移事实 reason；③对 3rd-review 侧未完 session 只做解耦（本仓不再等待、不再消费其结果），不调用 cancelManaged、不修改既有断言、不绕 D-030③；④显式 judged retry（补 material_changed）仍可重发；报告侧不再出现大批失败码落为未归类
  - **范围边界**：锚点校验仍要求 existsSync + 行号；止损不接 cancelManaged（D-010 否决，OI-23 同向）；不调低 minimum_heterologous
  - **依据**：D-011、PFACT-009
  - **场景**：SCN-001、SCN-004
  - **验收**：AC-CLEANUP-005

### 收口重绑治理域（REBIND）

材料写入使已发布确认与交互聚合失效的级联，按用户裁定做 D4 并一并纳入三阶段治理；对照基线为本次收口实测的 4 次 confirm / 3 次聚合 / 164 文件。完整性语义变更经用户明确授权，decision-log 实质改动仍使确认失效的边界不放宽。

- **FR-REBIND-001**：F1/F2 落地——make-decision 自 step 11 起冻结材料，step 12/13/14 阶段事实只落 task store（quality/evidence/handoff/、quality/stage-reflection/<stage>/、facts.jsonl）；同批修订 workflows/make-decision/SKILL.md:219-225 为「step 1–10 写材料；step 11–14 只落 task store」
  - **范围边界**：F1 不回退的关键是 F2 同批；四个 agent 自造章节已删且精确节名计数保持 0
  - **依据**：D-026、PFACT-008
  - **场景**：SCN-010
  - **验收**：AC-REBIND-001

- **FR-REBIND-002**：D1 落地——workflows/build-spec/SKILL.md 与 docs/standard-workflow.md:191-195 明写「freeze-spec / review-frozen-spec 之后不得改写 decision-log.md；规格歧义按 fallback 协议路由回 make-decision」
  - **范围边界**：只补记流程语义，不改运行时
  - **依据**：D-026
  - **场景**：SCN-010
  - **验收**：AC-REBIND-002

- **FR-REBIND-003**：D2/D3 落地——workflows/build-plan/SKILL.md:101-108 明写「确认后唯一可写区是 tasks.md 的执行状态填写区，plan.md 语义段不得再改」；docs/standard-workflow.md:239 补记 build-plan step 12 的人工确认要求（消除与 SKILL 及 steps.json 的矛盾）
  - **范围边界**：不收窄 STAGE_FACT_MATERIALS（D5 否决）；不把 stage-runner.mjs:3057 改冻结指针（D6 否决）
  - **依据**：D-026、PFACT-018
  - **场景**：SCN-010
  - **验收**：AC-REBIND-003

- **FR-REBIND-004**：D4 读侧对称——runtime/stage/stage-runner.mjs:1681（currentConfirmationCandidate 的 scope 比较处）复用写侧已有的 isExecutionRecordOnlyMaterialDelta / isStageMaterialOnlySnapshotDelta（runtime/task/git-worktree-snapshot.mjs:503-526），约 4 行，一处改动同时覆盖 make-decision 与 build-plan；tests/contract/human-confirmation-v3.test.mjs:296-308 断言同步改到新边界，并在测试注释与材料中写明授权来源＝用户本轮裁定「再做 D4」
  - **范围边界**：这是经用户授权的完整性语义变更；decision-log.md 实质改动仍使确认失效，不得被豁免
  - **依据**：D-026、PFACT-018
  - **场景**：SCN-010
  - **验收**：AC-REBIND-004

### 治理边界域（GOV）

把非目标与硬约束转成可观察、可核验的行为要求，全部由 diff、行数表、命令退出码与账本逐条判定。

- **FR-GOV-001**：本任务全部改动不得减少、增加或搬移任何人工确认点（正常问题确认、stage 收尾确认、talk/grill 交互确认保持原样）
  - **范围边界**：diff 中 talk/grill/confirm/authorize 环节无增删
  - **依据**：D-001、PFACT-020
  - **场景**：SCN-011
  - **验收**：AC-GOV-001

- **FR-GOV-002**：不新增任何统计/收集/度量/遥测功能或常驻采集面；不产出无法实测的收益数字；不以 fixture/simulation 充当 after 证据
  - **范围边界**：measure-test-runtime-profile.mjs 不接消费者
  - **依据**：D-009、D-014
  - **场景**：SCN-011
  - **验收**：AC-GOV-002

- **FR-GOV-003**：除净减或持平例外清单 10 条外，每条修复控制面净减或持平；材料给出逐文件新增/删除行数表；例外逐条登记项、为什么是新增面、用户授权依据、删除条件
  - **例外清单第 10 条（spec 侧登记；decision-log 冻结不追写）**：项＝3rd-review/test/managed-session-lifecycle.test.mjs 守卫测试随非终态成员级公开面同批演进（断言改写到新边界并写明理由）；为什么是新增面＝OI-23 公开面演进（非终态信封携带成员级真实事实）被该守卫测试旧断言（managed-session-lifecycle.test.mjs:58-71 旧边界）阻挡，不同批改写则 BR 侧测试红、两仓测试同批跑通（RISK-009）破裂；授权依据＝用户本轮裁定原文「扩展授权：加入该守卫测试文件」（3rd-review 授权文件清单 5→6）；删除条件＝该守卫被经审查的替代断言取代
  - **范围边界**：清单外不得净增；删除不得换成搬家/改名/加统一层
  - **依据**：D-018、PFACT-020
  - **场景**：SCN-011
  - **验收**：AC-GOV-003

- **FR-GOV-004**：check-skill-closure 与 smoke-local-skill-dispatch 两个红灯在本任务内修到 exit 0；verify-structure 与 run-checks 不劣化；无新增 lint 错误（对照本任务现场复算的 28 error 基线）
  - **范围边界**：不以更新声明掩盖内容漂移
  - **依据**：D-015、D-020、PFACT-019
  - **场景**：SCN-011
  - **验收**：AC-GOV-004

- **FR-GOV-005**：延期文件 /Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md 更新为本任务正式交付物——DEF-01~07 每条写入终态、取消理由、重新考虑触发条件、owner；DEF-08（唯一验收账本＝acceptance_criterion facts）与 DEF-09 完整定义；文件与 decision-log 处置表逐条一致
  - **范围边界**：禁止「零延期」式声明
  - **依据**：D-013、D-016
  - **场景**：SCN-011
  - **验收**：AC-GOV-005

- **FR-GOV-006**：写入面守住——材料写入入口仍为 2 个、identity/executions 仍为单写者注册、quality/** 多写者面不扩大、不启用 material-workspace.mjs:91 第三套材料写入实现
  - **范围边界**：若引入第三个材料写入者或第二写者须在材料显式登记（实测不需要）
  - **依据**：D-002
  - **场景**：SCN-011
  - **验收**：AC-GOV-006

- **FR-GOV-007**：跨仓边界守住——3rd-review 写入逐条落在授权清单 6 文件内；不改 ~/.config/workflowhub/config.json 与 ~/.config/3rd-review/config.json；不减少 antigravity 派发、不收敛 provider 数量、不在本仓加缓解层
  - **范围边界**：越界即判 OI-08 失败；BR 侧验收单独登记
  - **依据**：D-019、D-022、PFACT-016
  - **场景**：SCN-012
  - **验收**：AC-GOV-007

- **FR-GOV-008**：维持零页面（non_ui）——不新增页面、路由、前端依赖；build-reflection-page.mjs 仍无生产调用者；成本相关信息只走既有 CLI 文本输出
  - **范围边界**：diff 无任何前端面
  - **依据**：D-017
  - **场景**：SCN-011
  - **验收**：AC-GOV-008

- **FR-GOV-009**：根因定位只用读代码与既有落盘事实；材料中凡引用无原件的历史数字处必须标注「无原件不可复核」，不得作为收益基线
  - **范围边界**：不新跑真实任务、不新建采集面
  - **依据**：D-003、D-006、D-009、PFACT-007
  - **场景**：SCN-011
  - **验收**：AC-GOV-009

- **FR-GOV-010**：每条修复逐项写出通过判据与失败判据，并落入唯一验收账本 acceptance_criterion facts；不出现只有「阻塞不再发生」式无法证伪措辞的判据
  - **范围边界**：账本只有一种，不新建第二本
  - **依据**：D-007、PFACT-020
  - **场景**：SCN-011
  - **验收**：AC-GOV-010

## 6. 模块划分

### 审查等待模块

- **负责什么**：单轮审查的等待、到期前终态复检、不可用审查的复用守卫
- **对外提供什么**：审查结果或明确失败，不产生永久不可重试的不可用审查
- **依赖谁**：3rd-review broker 的状态发布与重发语义
- **测试边界**：终态复检场景、复用守卫场景、judged retry 放行

### provider 健康模块

- **负责什么**：antigravity 型超时的诚实识别、超时归类与重发、非终态成员级真实事实的暴露与消费
- **对外提供什么**：可区分「真卡死」与「健康但慢」的可判定事实，失败成员即时可见
- **依赖谁**：派发前预检的结论、broker 重发策略
- **测试边界**：agy 超时最小复现、卡死/慢区分、守卫测试同批演进

### 派发前预检模块

- **负责什么**：provider 身份白名单、model id、CLI 可执行性、认证、活性探测的 go/no-go
- **对外提供什么**：blocked_before_dispatch 结论与零 provider 派发
- **依赖谁**：3rd-review provider 注册信息（SUPPORTED_PROVIDER_IDS）
- **测试边界**：五类拦截各附针对性测试

### 格式宽容模块

- **负责什么**：输入剥前缀与逐条 anchor 宽容、输出 JSONL/多围栏/更大包裹/多余键/别名容忍、脱敏边界正确性、7 条红线守护
- **对外提供什么**：异源审查建议（findings）或结构化失败，不再因格式问题整员失败
- **依赖谁**：审查标准与 prompt（不变）
- **测试边界**：甲/乙/丙三类样本、CJK 脱敏判据、反向断言改写理由

### 质量事实绑定模块

- **负责什么**：direction/detail 两轨 review 事实与 result 的本轨绑定
- **对外提供什么**：无谎报的质量事实账本
- **依赖谁**：execute 输入 receipt 的真实性
- **测试边界**：单轨提交的两个镜像场景

### 清理与基线模块

- **负责什么**：重采残留、死代码、无消费者私有面的净减删除；skill 声明哈希与披露措辞基线对齐
- **对外提供什么**：净减行数表、两检查 exit 0
- **依赖谁**：bundle 声明机制、既有测试基线
- **测试边界**：行数表逐文件、两红灯与回归测试

### 收口确认模块

- **负责什么**：材料冻结语义、确认身份与读侧对称、收口一次确认一次聚合
- **对外提供什么**：稳定的确认命中与失效边界
- **依赖谁**：材料修订、快照、写侧豁免判定的既有实现
- **测试边界**：三类变化场景的确认命中/失效判定

### 治理边界模块

- **负责什么**：非目标堵口、净减或持平约束、例外清单、写入面与跨仓边界的 diff 级核验
- **对外提供什么**：可逐条核验的边界结论
- **依赖谁**：四份当前材料
- **测试边界**：12 项非目标与 10 条例外的逐条对照

## 7. 关键实体

- **审查 attempt**：
  - **定义**：一次审查请求的运行记录（review 级）
  - **字段和约束**：key、dispatch_state（blocked_before_dispatch/dispatched/reused）、provider_attempts 计数、material_id；复用键相同但不可用结果不得复用
  - **关系**：包含多个 provider attempt；派生 review 质量事实
- **provider attempt（成员级）**：
  - **定义**：单个 provider 一次执行的公开事实
  - **字段和约束**：status、error.code、last_progress_at_ms、attempts[n]（以 parse 结果为准，进程失败与解析失败可归因区分）、raw_output_ref、raw_stderr_sha256；新增持久字段须在 attempt.schema.json 登记唯一 consumer 与删除条件
  - **关系**：隶属审查 attempt；失败事实非终态可见
- **成员级健康事实**：
  - **定义**：非终态信封中暴露的某成员真实状态
  - **字段和约束**：status、error.code、last_progress_at_ms 三件套；只放宽非终态携带条件，成员级必需键与 fail-closed 不放宽
  - **关系**：由 broker 披露、WH 轮询消费
- **review 质量事实**：
  - **定义**：stage 质量账本中 subject 为 direction_review 或 detail_review 的事实
  - **字段和约束**：subject、status、指向本轨 result 的引用；同一 subject 不得并存两条指向不同 result 的冲突事实
  - **关系**：由 execute 依据 receipt 派生；进入唯一验收账本的证据链
- **人工确认**：
  - **定义**：用户答复的不可变确认原件
  - **字段和约束**：绑定 material_revision 与 snapshot_tree；仅执行记录区改写或仅非材料快照变化时既有确认仍命中；decision-log 实质改动使确认失效
  - **关系**：确认后约束 make-decision 材料冻结与 build-plan 可写区
- **验收账本条目**：
  - **定义**：acceptance_criterion fact，本任务唯一验收账本
  - **字段和约束**：每条修复的通过判据与失败判据逐条落入
  - **关系**：verify-code 消费同一账本
- **延期条目**：
  - **定义**：/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md 中的逐项处置
  - **字段和约束**：终态（做/取消）、理由、触发条件、owner；DEF-08/DEF-09 完整定义
  - **关系**：与 decision-log 处置表逐条一致

## 8. 数据和生命周期

- **数据粒度**：provider attempt 是单 provider 单次的公开事实；review 质量事实按 subject 一条当前事实；验收账本按修复条目一条。
- **数据时效**：成员级健康事实在成员进入明确失败态时立即可读；attempt 公开事实在 parse 完成后定稿；review 事实在 execute 派生时绑定本轨 result。
- **缺失或迟到**：缺轨 receipt 时该轨不产生 recorded 事实（不得回落他轨）；不可用的零 provider 审查不得被复用，judged retry 单独放行。
- **预览与正式**：非终态信封可携带顶层 `providers` map；若携带，必须以 provider id 为键，成员至少包含 `status`、`error.code`、`last_progress_at_ms`，且 map 及成员严格校验，任何非法均 fail-closed。旧的合法非终态 envelope 缺失 `providers` 时，保留既有 5-key 消费路径，不误报 `PROTOCOL_INCOMPATIBLE`；缺失健康事实不得宣称已观测。`group` 只有 terminal 信封携带，非终态携带 `group` 仍拒绝。`providers` 是相对旧信封的 additive key：兼容过渡允许旧 WH 容忍该附加键，同时保留既有必需键与七条 fail-closed 边界；不存在「预览态」被当作正式结果消费的路径。
- **当前与历史**：质量事实内容寻址不可变；current 口径唯一——两轨 review fact 各绑本轨 result 者为本轨 current，历史错绑/重复 fact 保留为 provenance、不参与当前判定（查询当前事实时以本轨绑定为准，不被历史冲突事实污染）；无原件历史数字标注「无原件不可复核」。
- **归属与清理**：attempt.schema.json 新字段登记唯一 consumer、owner、删除条件；死代码与无消费者私有面（记录锁、freshness 死代码、死常量）本任务内删除；延期条目归 Downloads 单一清单。

## 9. 兼容性预留

- **既有消费方**：WH 轮询从只看 current.state 升级为消费成员级事实；旧 WH 遇到新 BR 字段的顺序约束——同一批改动内先让 WH 容忍额外键（FORMAT 乙类）、再让 BR 发布新字段（HEALTH/BROKER），两仓测试同批跑通后才算闭合（RK-9）。
- **命名预留**：适配器层诚实超时码 PROVIDER_PRINT_TIMEOUT 与 broker 归类层 PROCESS_TIMEOUT 两名按层映射写明，后续若归并可在此映射处收口。
- **容器预留**：attempt.schema.json 新增字段走属性表登记；信封额外键容忍为后续字段发布留出空间，必需键集合不变。
- **状态预留**：非终态信封新增成员级事实不改变 terminal 语义；group 仍只在 terminal 携带。
- **扩展边界**：20 分钟阈值、minimum_heterologous、7 条红线、五阶段流程与人工确认点本期均不预留变化；验收对照基线（4 次 confirm / 3 次聚合 / 164 文件）写明供 build-code 比对「此后同类收口只发生一次确认与一次聚合」。

## 10. 明确不做与默认必须成立

### 明确不做

1. 不改五阶段流程本身，不改任何人工确认点的数量与位置（D-001，永久）。
2. 不新增任何统计、收集、度量、遥测类功能或常驻采集面（D-009，永久）。
3. 不恢复 m15-retirement 删除的遥测五件套（含 runtime/evidence/monitoring-facts.mjs）（D-008，永久）。
4. 不新增第五份材料、不新增公共命令、不新增持久对象、不新增第二状态机（D-018/D-002，永久；attempt.schema.json 字段登记属例外清单第 6 条授权）。
5. 不改 wh-review 每阶段审查标准与 prompt（历史非目标，D-011 边界）。
6. 除授权清单 6 文件外不写入 3rd-review 仓（D-019/D-022，本任务内授权边界；第 6 文件＝守卫测试，用户本轮扩展授权）。
7. 不改动 specs/archive/** 历史 provenance 字节，不迁移历史任务，不做兼容桥，不做双写（D-008，永久）。
8. 不减少人工确认、不引入自动越过人的推进（D-001，永久）。
9. 不产出无法实测的收益数字，不以 fixture/simulation 充当 after 证据（D-014，永久）。
10. 不把锚点校验降级为仅记录、不把私有路径检查改为告警、不调低 minimum_heterologous（D-011，红线）。
11. 不复活已由 C6 删除的持久对象（quality-verify.v1 等），不启用 material-workspace.mjs:91 第三套材料写入实现（D-013/D-002）。
12. 不做「受影响接缝映射表」或其他新增映射/字段式的重采分级（D-012）。
13. 不改 ~/.config/workflowhub/config.json 与 ~/.config/3rd-review/config.json（D-019，用户原话禁止）。
14. 不减少 antigravity 派发、不把每条 route 收敛为 1 主力 + 1 备选、不在本仓加第二轮 broker run 缓解层（D-019，用户裁定伪造需求作废）。
15. 不把 20 分钟阈值改为 600000 或任何其它数字（D-004，审查 major 处置采纳）。
16. 不为不可达记录锁改 waitMs，不为接通 cancelManaged 修改既有断言或绕过 D-030③（D-010）。
17. 不把 stage-runner.mjs:3057 改为冻结指针（D6 否决），不把 build-plan 的 STAGE_FACT_MATERIALS 收窄为两份（D5 否决）（D-026）。

### 默认必须成立

- 20 分钟上限数值保持 1_200_000 不变（FR-WAIT-001、AC-WAIT-001）。
- minimum_heterologous/quorum 与锚点校验（existsSync + 真实行号）逐项不变（FR-FORMAT-004、AC-FORMAT-004）。
- 私有/宿主路径 fail-closed 只许缩小爆炸半径，不许改告警后采用（FR-FORMAT-002、AC-FORMAT-002）。
- 材料写入入口 2 个、identity 单写者、quality 多写者面不扩大（FR-GOV-006、AC-GOV-006）。
- 人工确认点、talk/grill 交互、stage 收尾确认保持原样（FR-GOV-001、AC-GOV-001）。
- antigravity 派发数量与 provider 覆盖广度不降（FR-GOV-007、AC-GOV-007）。

## 11. 验收标准

- [ ] **AC-WAIT-001**：到期前终态复检消除白等，阈值数字不动
  - **需求**：FR-WAIT-001；场景：SCN-002
验证：构造 operation 已 terminal 但等待侧轮询尚未察觉的审查场景，观察等待侧是否在上限到期前复检并直接消费结果；同时 diff 核对 1_200_000 阈值未被改动。
通过：不再空等到 20 分钟上限，终态结果被直接消费；阈值数字可 diff 验证未变。
失败：仍空等到 20 分钟上限才返回，或 1_200_000 数值被改动而无现场依据。
证据：针对性测试记录与复现命令输出（test）。
- [ ] **AC-WAIT-002**：不可用审查不得被复用钉死，judged retry 仍可用
  - **需求**：FR-WAIT-002；场景：SCN-003
验证：构造 REVIEW_WAIT_EXCEEDED 且 provider_attempts 为 0 的不可用审查，同 key 再次发起请求观察是否复用；再以显式 judged retry 发起。
通过：同 key 新请求不复用该失败 attempt（不 reused）；显式 judged retry 被放行；不存在永久不可重试的不可用审查。
失败：同 key 请求出现 reused:true 复用失败 attempt，或显式 retry 被拒且无材料依据。
证据：attempt 目录原件与针对性测试（test）。
- [ ] **AC-HEALTH-001**：agy 超时被诚实识别为 PROVIDER_PRINT_TIMEOUT 而非模型空输出
  - **需求**：FR-HEALTH-001；场景：SCN-004
验证：用 --print-timeout 2s 最小复现构造 agy 超时（退出码 0、空 stdout、stderr 79 字节 print timeout 警告），经 wh-review 调用链观察产出事实类别。
通过：产出可区分的超时事实（PROVIDER_PRINT_TIMEOUT），不再出现 emitted no final text 归类；授权仅 2 处（argv +1 元素、parse 改读 stderr）。
失败：仍被归为 PROVIDER_OUTPUT_INVALID「emitted no final text」，或改动越出授权文件。
证据：复现 attempt 的 stderr/stdout 与归类字段原件（evidence）。
- [ ] **AC-HEALTH-002**：超时归类正确并纳入重发
  - **需求**：FR-HEALTH-002；场景：SCN-004、SCN-006
验证：检查 provider-failure 对 agy print timeout 串的归类与 recovery-policy 重发表；核对材料中 PROVIDER_PRINT_TIMEOUT 与 PROCESS_TIMEOUT 的层间映射写明。
通过：该串识别为超时类（进入重发表的 PROCESS_TIMEOUT），不再误归 PROCESS_EXIT_NONZERO；层间映射在材料可查。
失败：仍归 PROCESS_EXIT_NONZERO，或 PROCESS_TIMEOUT 不在可重发表，或两名映射未写明。
证据：针对性测试与材料节（test）。
- [ ] **AC-HEALTH-003**：非终态成员级事实暴露并被轮询消费
  - **需求**：FR-HEALTH-003；场景：SCN-006
验证：运行含 antigravity 的 managed 审查，在成员进入失败态后读取非终态信封与 WH 轮询行为；核对守卫测试 managed-session-lifecycle.test.mjs:58-71 已同批改并写明理由。
通过：非终态信封暴露成员 status、error.code、last_progress_at_ms；WH 立即得到可判定事实，不必等满 20 分钟；守卫测试改到新边界且理由写明，必需键与 fail-closed 未放宽。
失败：非终态信封无成员级事实，或 WH 仍须等满时限，或守卫测试未同批改。
证据：信封原件、守卫测试改动记录与材料理由（test）。
- [ ] **AC-HEALTH-004**：真卡死与健康但慢可区分
  - **需求**：FR-HEALTH-004；场景：SCN-006
验证：对照 agy stderr 含 print timeout 串的失败 attempt 与健康但慢的 attempt，观察归类与处置差异。
通过：前者识别为超时类失败并可触发停止/重发，后者按健康但慢处理不被误杀；停滞的可观察判据为成员 error.code 已置位或 provider 自报超时，无自报信号的真卡死由既有 20 分钟上限与到期前终态复检兜底；spec 不新增 broker 状态机。
失败：两类 attempt 不可区分、健康但慢成员被误杀，或为卡死检测新增状态机/墙钟判死。
证据：两类 attempt 事实对照（evidence）。
- [ ] **AC-BROKER-001**：single_round 与 full_only 各获得一次 fresh_execution 重发
  - **需求**：FR-BROKER-001；场景：SCN-006
验证：对 single_round 与 full_only 各构造一次可重发类失败（如 PROCESS_TIMEOUT），观察重发计数。
通过：两模式均获得一次 fresh_execution 重发。
失败：重发仍被关闭（fresh_execution_retry_count 为 0）。
证据：针对性测试与 broker 记录（test）。
- [ ] **AC-BROKER-002**：same_session_repair 无 resume 时降级 fresh_execution
  - **需求**：FR-BROKER-002；场景：SCN-006
验证：构造 same_session_repair 策略下无 resume 可用的失败，观察降级路径。
通过：自动降级为 fresh_execution 并执行，不再静默 no-op。
失败：same_session_repair_count 为 0 且无 fresh_execution 发生。
证据：针对性测试与 broker 记录（test）。
- [ ] **AC-BROKER-003**：attempt 公开事实以 parse 结果为准
  - **需求**：FR-BROKER-003；场景：SCN-004
验证：复现进程 ok 但输出解析失败的场景，读取公开 attempt 事实。
通过：attempts[0] 记录与 parse 结果一致（failed 带错误码），进程失败与解析失败可归因区分。
失败：失败 attempt 仍被记为 completed 且 error 为 null。
证据：公开 attempt 事实原件与复现记录（evidence）。
- [ ] **AC-BROKER-004**：attempt.schema.json 登记新增字段并修抛错缺口
  - **需求**：FR-BROKER-004；场景：SCN-004
验证：审查 attempt.schema.json 属性表与新增字段登记；复跑 review-result 写 execution 字段路径。
通过：新增字段有名字、类型、枚举、生产者、唯一 consumer 与删除条件——process_outcome（ok/exit_nonzero/timeout/launch_failure）与 parse_outcome（ok/invalid/empty_output）两项已按契约登记且组合可归因区分进程失败与解析失败；写事实不再抛 TypeError。
失败：schema 未登记新字段，或写 execution 字段仍抛错。
证据：schema 改动与针对性测试（test）。
- [ ] **AC-PREFLIGHT-001**：非法 host_provider 在派发前被拦下
  - **需求**：FR-PREFLIGHT-001；场景：SCN-005
验证：以 host_provider 取 claude 调用 wh-review run。
通过：在 buildBundle、加锁、dispatch 之前落 blocked_before_dispatch，provider_attempts 为 0。
失败：通过 WH 预检到达 3rd-review 才在 broker 处失败。
证据：预检拦截 attempt 原件（test）。
- [ ] **AC-PREFLIGHT-002**：model id / CLI 可执行性 / 认证 / 活性探测四项预检生效
  - **需求**：FR-PREFLIGHT-002；场景：SCN-005
验证：分别以不存在的 model id（取 `agy models` 清单外值）、不可执行的 CLI、形状非法的认证、活性探测失败的 provider 发起审查。
通过：四项均在 buildBundle、加锁、dispatch 之前被拦下，落 blocked_before_dispatch 且 provider_attempts 为 0，各带结构化 error.code（MODEL_ID_INVALID / CLI_UNAVAILABLE / AUTH_INVALID / ACTIVE_PROBE_FAILED）与预检诊断字段；单 provider 被拦时该 provider 跳过、其余 provider 照常派发；同组全部被拦时本次请求在 dispatch 前失败；各附针对性测试。
失败：任一项到达 dispatch 才失败，或被拦时无 exit 状态、无结构化错误码、无零派发事实可观察。
证据：四项针对性测试记录与被拦 attempt 原件（test）。
- [ ] **AC-PREFLIGHT-003**：预检能力边界写明
  - **需求**：FR-PREFLIGHT-003；场景：SCN-005、SCN-006
验证：核对材料与预检文档中的能力边界声明。
通过：写明 antigravity 型运行时失败静态预检原理上抓不到、由审查中健康检测承接。
失败：未写明边界，或宣称预检可拦截运行时失败。
证据：材料节与文档核对记录（manual）。
- [ ] **AC-FORMAT-001**：甲类误杀修复（不连坐、保原 code、不吞 parse 错）
  - **需求**：FR-FORMAT-001；场景：SCN-007
验证：构造成员 output 含一个 /xxx 路径的组审查与普通 broker 失败 message 含路径的场景。
通过：只 fail 越界成员、组记 partial；路径检查只扫结构化路径字段；脱敏保原 code 并附 cause_code；空 catch 不再吞 parse 错；死常量删除；截断标记覆盖所有丢段路径。
失败：整组被判 PUBLIC_RESULT_INVALID、真实 code 丢失或 parse 错仍被吞。
证据：甲类逐条针对性测试（test）。
- [ ] **AC-FORMAT-002**：CJK 脱敏边界正确
  - **需求**：FR-FORMAT-002；场景：SCN-007
验证：对含 CJK 标点的材料调用 redactProviderHostPaths，脱敏前后逐项比对 token 计数。
通过：路径后紧跟的非路径文本不被吞掉；DEF-01、取消理由： 等 token 计数逐项不变。
失败：仍出现吞并正文（如 DEF-01 计数 20→19、总字节 -1196 的形态）。
证据：脱敏前后对照输出（test）。
- [ ] **AC-FORMAT-003**：乙类格式宽容取得 findings
  - **需求**：FR-FORMAT-003；场景：SCN-008
验证：用 JSONL、多围栏唯一含 findings、更大包裹、顶层多余键、severity 别名的样本输出跑解析；用带额外键的非终态信封跑客户端校验。
通过：各样本均取得 findings；非终态信封忽略额外键且保留必需 5 键；抽取优先级（JSONL＞单 fence JSON＞首个可解析候选）、severity 别名映射与「只丢该条不整员失败」规则逐项可复现。
失败：任一格式样本仍整员判 OUTPUT_INVALID，或多候选/别名处理结果不确定。
证据：乙类样本测试套件（test）。
- [ ] **AC-FORMAT-004**：丙类 7 条红线原样保留
  - **需求**：FR-FORMAT-004；场景：SCN-008
验证：diff 核对 7 条红线相关代码与断言；核对反向断言改写的理由与新边界说明。
通过：私路 fail-closed、finding 落真实材料行、minimum_heterologous、材料白名单与固定指令、材料身份绑定、envelope 必需键、非 minor 需 evidence_kind/evidence/root_cause 逐项未改动；反向断言改动写明理由。
失败：任一红线被放宽，或断言改动无理由。
证据：diff 与材料说明核对（manual）。
- [ ] **AC-BINDING-001**：两轨 review 事实各绑本轨 result
  - **需求**：FR-BINDING-001；场景：SCN-009
验证：先只提交 direction receipt 运行 execute，再只提交 detail receipt 运行 execute，读取两条 quality fact 的指向。
通过：direction_review 绑 direction result、detail_review 绑 detail result；缺轨不产生错绑 recorded 事实。
失败：任一轨事实指向另一轨 result。
证据：两次 execute 落盘 fact 原件（test）。
- [ ] **AC-BINDING-002**：一 subject 不并存两条冲突事实
  - **需求**：FR-BINDING-002；场景：SCN-009
验证：修复后核对质量事实账本中 review subject 的事实集合。
通过：同一 subject 的 current 事实不存在两条指向不同 result 的冲突事实（历史 fact 保留为 provenance 不参与当前判定）。
失败：仍存在一 subject 两条指向不同 result 的事实。
证据：quality/facts 账本核对记录（evidence）。
- [ ] **AC-CLEANUP-001**：重采残留修复且净行数为负
  - **需求**：FR-CLEANUP-001；场景：SCN-011
验证：diff 统计重采相关改动并跑发布路径针对性测试。
通过：{fresh:true} 两处强制全量重采去除；freshness.mjs 死代码与 3 处测试引用删除；净行数为负；源稳定性防护由既有 revision/hashes 检查承担且有测试覆盖。
失败：采用接缝映射表方案，或去掉后出现事实绑到漂移源的可复现路径。
证据：行数表与针对性测试（test）。
- [ ] **AC-CLEANUP-002**：15 分钟记录锁净减删除
  - **需求**：FR-CLEANUP-002；场景：SCN-011
验证：删除前做全仓 consumer 扫描（含测试与工具引用）与安全不变式审查；删除后复算行数。
通过：函数本体、专属锁、仅服务它的私有导出与测试全部删除，行数净减；材料中给出无消费者证明。
失败：仍保留不可达记录锁，或净行数为正，或无 consumer 证明。
证据：consumer 扫描输出与行数表（evidence）。
- [ ] **AC-CLEANUP-003**：DEF-09 闭合
  - **需求**：FR-CLEANUP-003；场景：SCN-011
验证：构建期删除 ui-e2e-contract-dogfood.test.mjs:223 残留字面量并检索活动命中。
通过：quality-verify.v1 活动命中数降为 0，受影响测试 GREEN。
失败：残留字面量仍在或测试红。
证据：命中检索输出与测试记录（test）。
- [ ] **AC-CLEANUP-004**：两红灯转绿且基线写明
  - **需求**：FR-CLEANUP-004；场景：SCN-011
验证：重跑 check-skill-closure 与 smoke-local-skill-dispatch；核对声明对齐文件数与披露措辞行数。
通过：两检查 exit 0；声明对齐为 4 个声明文件 9 行值替换净 0（spec-analyze 2 行、stage-handoff 1 行、stage-reflection 1 行、catalog.yaml 5 行）；约 +10 行 outcome 披露措辞补回；材料写明接受 25b44430 字节为基线；stage-reflection-wiring 第三条回归闭合。
失败：以更新声明掩盖漂移、回退内容，或未写明基线接受。
证据：两检查退出码与行数表（test）。
- [ ] **AC-CLEANUP-005**：失败率本仓可控修复落地
  - **需求**：FR-CLEANUP-005；场景：SCN-001、SCN-004
验证：跑三条实现 bug 的针对性测试并构造源漂移止损场景。
通过：锚点校验仍要求 existsSync + 真实行号；失败码不再大批落为未归类；源漂移事实成立时立即中止等待轮询、attempt 记 failed 且 error.code=REVIEW_SOURCE_DRIFT、未完 session 解耦事实可观察（不调用 cancelManaged）；每条附针对性测试。
失败：锚点校验降级、引入墙钟判死，或失败码仍大批未归类。
证据：针对性测试记录（test）。
- [ ] **AC-REBIND-001**：make-decision 收口材料冻结
  - **需求**：FR-REBIND-001；场景：SCN-010
验证：核对 workflows/make-decision/SKILL.md:219-225 改写与材料中四个自造章节精确节名计数。
通过：SKILL 已写明 step 1–10 写材料、step 11–14 只落 task store；四节精确节名计数为 0。
失败：SKILL 未改或四节仍在。
证据：SKILL 文本与节名计数输出（manual）。
- [ ] **AC-REBIND-002**：build-spec 冻结语义补记
  - **需求**：FR-REBIND-002；场景：SCN-010
验证：核对 build-spec SKILL 与 docs/standard-workflow.md:191-195。
通过：两处明写 freeze-spec / review-frozen-spec 之后不得改写 decision-log.md，规格歧义按 fallback 协议路由回 make-decision。
失败：任一处未补记。
证据：两处文本核对（manual）。
- [ ] **AC-REBIND-003**：build-plan 可写区与确认补记
  - **需求**：FR-REBIND-003；场景：SCN-010
验证：核对 build-plan SKILL:101-108 与 docs/standard-workflow.md:239。
通过：前者明写确认后唯一可写区是 tasks.md 执行状态填写区；后者补记 build-plan step 12 人工确认要求；两处不再矛盾。
失败：未补记或矛盾仍在。
证据：两处文本核对（manual）。
- [ ] **AC-REBIND-004**：读侧对称生效且实质改动仍失效
  - **需求**：FR-REBIND-004；场景：SCN-010
验证：构造三类变化——仅改写 tasks.md 执行状态填写区、仅发生非材料快照变化、decision-log.md 实质改动——分别调用 currentConfirmationCandidate 判定。
通过：前两类仍命中既有确认（返回同一 confirmation ref）；第三类使确认失效；human-confirmation-v3.test.mjs:296-308 断言已按新边界更新并注明授权来源。
失败：实质改动也被豁免，或断言只改不写理由。
证据：三类场景判定输出与测试改动记录（test）。
- [ ] **AC-GOV-001**：人工确认点零改动
  - **需求**：FR-GOV-001；场景：SCN-011
验证：审查本任务全量 diff 中 talk/grill/confirm/authorize 相关改动。
通过：无任何减少、增加或搬移人工确认点的改动。
失败：出现相关改动。
证据：全量 diff 审查记录（manual）。
- [ ] **AC-GOV-002**：零采集面、零收益数字
  - **需求**：FR-GOV-002；场景：SCN-011
验证：审查 diff 与材料措辞。
通过：无新增采集文件、字段或命令；不出现未实测收益数字；不以 fixture/simulation 充当 after。
失败：出现任一。
证据：diff 与材料核对记录（manual）。
- [ ] **AC-GOV-003**：净减或持平与例外清单约束
  - **需求**：FR-GOV-003；场景：SCN-011
验证：逐文件行数表对照例外清单 10 条。
通过：清单外每条修复净减或持平；例外逐条登记项、依据与删除条件。
失败：清单外净增，或删除被换成搬家/改名/加统一层。
证据：逐文件行数表（evidence）。
- [ ] **AC-GOV-004**：两红灯转绿且不劣化
  - **需求**：FR-GOV-004；场景：SCN-011
验证：跑 check-skill-closure、smoke-local-skill-dispatch、verify-structure、run-checks 并对照基线。
通过：前两者 exit 0；后两者不劣化；无新增 lint 错误（对照本任务现场复算的 28 error 基线）。
失败：任一不满足，或以掩盖方式变绿。
证据：四命令退出码与输出（test）。
- [ ] **AC-GOV-005**：延期文件更新交付
  - **需求**：FR-GOV-005；场景：SCN-011
验证：核对延期文件与 decision-log 处置表逐条一致。
通过：DEF-01~07 每条有终态、取消理由、触发条件、owner；DEF-08/DEF-09 完整定义。
失败：未更新或出现无理由悬空条目。
证据：延期文件文本（manual）。
- [ ] **AC-GOV-006**：写入面守住
  - **需求**：FR-GOV-006；场景：SCN-011
验证：核对材料写入入口、identity 写者与 quality 写者面。
通过：材料入口仍 2 个、identity 仍单写者、quality 多写者面未扩大、第三套材料写入实现未启用。
失败：引入第三材料写入者或第二 identity 写者。
证据：写入面核对记录（manual）。
- [ ] **AC-GOV-007**：跨仓授权边界守住
  - **需求**：FR-GOV-007；场景：SCN-012
验证：核对 3rd-review 仓 diff 与两个 config 文件状态、antigravity 派发配置。
通过：写入逐条落在授权 6 文件清单内；两 config 未改；派发未减少。
失败：越界写入或 config 被改。
证据：跨仓 diff 与 config 状态核对（manual）。
- [ ] **AC-GOV-008**：零页面维持
  - **需求**：FR-GOV-008；场景：SCN-011
验证：审查 diff 中页面、路由、前端依赖。
通过：无新增；build-reflection-page.mjs 仍无生产调用者；UI applicability 保持 non_ui。
失败：出现新增页面或前端依赖。
证据：diff 审查记录（manual）。
- [ ] **AC-GOV-009**：无原件数字全部标注
  - **需求**：FR-GOV-009；场景：SCN-011
验证：审查材料引用的历史数字。
通过：无原件的历史数字均标注「无原件不可复核」；根因结论附文件：行号与可复现只读命令。
失败：未标注即当作事实引用，或以其作为收益基线。
证据：材料核对记录（manual）。
- [ ] **AC-GOV-010**：验收账本唯一且逐项可判
  - **需求**：FR-GOV-010；场景：SCN-011
验证：核对 acceptance_criterion facts 账本。
通过：每条修复的通过判据与失败判据逐项落入账本；无单独以「阻塞不再发生」充当判据的条目。
失败：判据缺失或账本形式不符。
证据：账本 facts 清单（evidence）。

## 12. 风险、未决与交接

- **RISK-001（RK-1）**：3rd-review 侧改动需单独验收
  - **受影响 ID**：FR-HEALTH-001~003、FR-BROKER-001~003、FR-FORMAT-001
  - **触发条件**：跨仓修复落地
  - **后果**：BR 侧缺陷不计入本仓通过判据，需独立核对
  - **缓解或 STOP**：边界按 talk-round-4 与 grill-G2 授权清单锁定；BR 侧验收单独登记
  - **处理 Stage**：build-code / verify-code
  - **验证**：AC-GOV-007 与 BR 侧单独验收记录
- **RISK-002（RK-2）**：记录锁删除可能打断未发现 consumer
  - **受影响 ID**：FR-CLEANUP-002
  - **触发条件**：删除前 consumer 扫描有遗漏
  - **后果**：既有能力回归
  - **缓解或 STOP**：删除前全仓扫描（含测试与工具引用）+ 安全不变式证明写入材料
  - **处理 Stage**：build-code
  - **验证**：AC-CLEANUP-002
- **RISK-003（RK-3）**：对齐声明哈希等于把 25b44430 字节接受为基线
  - **受影响 ID**：FR-CLEANUP-004
  - **触发条件**：该批字节本身有误
  - **后果**：错误被固化
  - **缓解或 STOP**：材料明写「接受 25b44430 为基线」；C2 回退已被硬反例否决
  - **处理 Stage**：build-code
  - **验证**：AC-CLEANUP-004
- **RISK-004（RK-4）**：补回披露措辞净 +10 行突破净减约束
  - **受影响 ID**：FR-CLEANUP-004
  - **触发条件**：披露措辞补回
  - **后果**：与硬规则冲突
  - **缓解或 STOP**：已登记例外清单第 1 条，用户认可
  - **处理 Stage**：build-code
  - **验证**：AC-GOV-003
- **RISK-005（RK-5）**：改 wh-review 脚本后 bundle 与 catalog 哈希必须同步重算
  - **受影响 ID**：FR-FORMAT-001~003、FR-CLEANUP-004
  - **触发条件**：改完未同步重算
  - **后果**：检查仍红
  - **缓解或 STOP**：与 OI-20 的 C1 同批执行
  - **处理 Stage**：build-code
  - **验证**：AC-GOV-004
- **RISK-006（RK-6）**：20 分钟空等成本可能被高估（对照基线 5m50s 未触发上限）
  - **受影响 ID**：FR-WAIT-001
  - **触发条件**：按基线外推
  - **后果**：收益判断偏差
  - **缓解或 STOP**：只消除白等与被钉死，不动阈值；基线如实留档
  - **处理 Stage**：verify-code
  - **验证**：AC-WAIT-001
- **RISK-007（RK-7）**：历史重采数字无原件
  - **受影响 ID**：FR-CLEANUP-001、FR-GOV-009
  - **触发条件**：材料引用历史数字
  - **后果**：误判收益
  - **缓解或 STOP**：标注「无原件不可复核」，不得作为收益基线
  - **处理 Stage**：build-code
  - **验证**：AC-GOV-009
- **RISK-008（RK-8）**：范围上限被用户主动取消，改动面显著扩大
  - **受影响 ID**：FR-GOV-003
  - **触发条件**：修复演化成机制加法
  - **后果**：重演同类任务失控形态
  - **缓解或 STOP**：例外清单 10 条逐条锁边界；清单外仍受净减或持平约束
  - **处理 Stage**：build-code / verify-code
  - **验证**：AC-GOV-003
- **RISK-009（RK-9）**：跨仓信封演进时序——旧 WH 遇新 BR 字段可能误杀
  - **受影响 ID**：FR-HEALTH-003、FR-FORMAT-003
  - **触发条件**：两仓改动不同批
  - **后果**：新误杀
  - **缓解或 STOP**：同批先让 WH 容忍额外键、再让 BR 发布新字段；两仓测试同批跑通
  - **处理 Stage**：build-code
  - **验证**：AC-FORMAT-003、AC-HEALTH-003
- **RISK-010（RK-10）**：格式宽容是方向性转向，与历史立场相反
  - **受影响 ID**：FR-FORMAT-003、FR-FORMAT-004
  - **触发条件**：反向断言被静默修改
  - **后果**：掩盖问题而非修边界
  - **缓解或 STOP**：反向断言修改写明理由与新边界；7 条红线 diff 可验证
  - **处理 Stage**：build-code / verify-code
  - **验证**：AC-FORMAT-004
- **RISK-011（RK-11）**：本增量决策本身已再造一次重绑
  - **受影响 ID**：FR-REBIND-001~004
  - **触发条件**：治理改动分批落地
  - **后果**：重复 4 次确认 / 3 次聚合 / 164 文件形态
  - **缓解或 STOP**：一次性写入 + 一次性重绑；本轮 67.4min/164 文件作为对照基线
  - **处理 Stage**：build-code
  - **验证**：AC-REBIND-001~004
- **RISK-012（RK-12）**：D4 改变确认完整性语义
  - **受影响 ID**：FR-REBIND-004
  - **触发条件**：读侧对称落地
  - **后果**：语义变更面；反例＝用户确认后又实质改主意而旧确认仍被复用
  - **缓解或 STOP**：用户已明确授权；decision-log 实质改动仍失效的边界不放宽，测试断言与材料共同守卫
  - **处理 Stage**：build-code / verify-code
  - **验证**：AC-REBIND-004

- **OPEN-001**：源漂移止损路径与 cancelManaged 禁令的张力（detail 轨 D7）——**已在 spec 闭合，实现归 build-code**
  - **受影响 ID**：FR-CLEANUP-005 / AC-CLEANUP-005
  - **owner**：build-code
  - **处置**：D-011 的止损意图保留（源漂移事实触发），机制按 OI-10/D-019/OI-23 的否决方向统一为「不接 cancelManaged」；spec 已给出可执行行为（中止轮询 + attempt 记 failed 带 error.code=REVIEW_SOURCE_DRIFT + 未完 session 解耦，均见 FR-CLEANUP-005）
  - **关闭条件或 STOP**：build-code 按上述契约落地并附针对性测试；不得为接通 cancelManaged 修改既有断言或绕 D-030③（OI-10 counterexample 仍有效）
- **OPEN-002**：失败分类合计 31 与 24 failed 的口径调和（detail 轨 D9）
  - **受影响 ID**：FR-CLEANUP-005
  - **owner**：build-code
  - **影响**：引用失败分类表时口径不一致会误导可控性判定
  - **处理 Stage**：build-code
  - **关闭条件或 STOP**：两口径调和或逐处标注口径差异
- **OPEN-003**：乙类宽容解析的确定性抽取规则（detail 轨 D12）——**已在 spec 闭合，实现归 build-code**
  - **受影响 ID**：FR-FORMAT-003 / AC-FORMAT-003
  - **owner**：build-code
  - **处置**：抽取优先级、severity 别名映射与拒绝规则已在 FR-FORMAT-003 定死；不触碰丙类 7 条红线
  - **关闭条件或 STOP**：build-code 按矩阵落地并对每种接受形态、多候选、混合 JSONL、别名各附针对性测试
- **OPEN-004**：attempt.schema.json 新增字段的形状设计（detail 轨 D13）——形状契约已在 spec 定死（FR-BROKER-004：process_outcome / parse_outcome 两字段的名/型/枚举/生产者/consumer/删除条件），实现归 build-code

### DEF-01~09 handoff 矩阵

延期项交接唯一载体为 `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`（OI-13/OI-16）；本任务 store 事实为机器可核的验收侧写。每行给出 DEF／终态／期望落点／验收事实：

| DEF | 终态 | 期望落点 | 验收事实 |
|---|---|---|---|
| DEF-01~07 | 逐条判「取消」，各带取消理由＋重新考虑触发条件＋owner | 延期文件对应条目 | 延期文件条目与 decision-log OI-13 处置表逐条一致（AC-GOV-005） |
| DEF-08 | 登记边界「唯一验收账本＝acceptance_criterion facts」（纯文字、零成本） | 延期文件 DEF-08 条目 | 文件中含 DEF-08 完整定义（AC-GOV-005） |
| DEF-09 | 本任务内闭合 | 延期文件 DEF-09 条目＋本 task store 事实 | tests/e2e/ui-e2e-contract-dogfood.test.mjs:223 残留 quality-verify.v1 字面量删除、活动命中数 0、受影响测试 GREEN（AC-CLEANUP-003） |

### plan-ceo-review 结论

本小节为 build-spec step 6（plan-ceo-review inline lens）的写回结论，基于当前 spec.md 与 decision-log.md 回答五个问题。本小节为 advisory 过程记录，不新增产品范围，不改写任何 FR/AC/SCN/PFACT 的编号与链，7 条审查红线与非目标边界保持不变。

1. **问题**：核心问题清晰——workflowhub 的审查与收口「耗时很长、token 浪费很多」；紧迫性有一手证据：72 次 provider attempt 中 24 次失败（33%）、antigravity 12 次内部超时被伪装成「模型无输出」、收口窗口 67.4 min 中空等 62.7 min、窗口内写 164 个文件、同一句话被重复确认 4 次、交互聚合重发 3 次；且每再拖一个收口窗口都会重演该级联（RK-11 对照基线）。结论：问题清晰、紧迫性成立。
2. **范围**：范围恰好等于决策授权——26 条 OI 与 26 条决定一一映射（来源与决策映射表），9 个 FR 域 38 条 FR 与 38 条 AC 全部可回溯到 R-001~R-018 与 D-001~D-026；第 10 节 17 条明确不做与决策 12 条非目标及 14 条拒绝方案逐条对齐；净减或持平例外 10 条与授权改动清单 6 文件逐条对应（例外第 10 条与第 6 文件＝守卫测试，用户本轮扩展授权）。未发现膨胀或遗漏。
3. **价值**：每条 FR 均可陈述行为价值，且不产出收益数字（非目标第 9 条）——FR-WAIT-001 让「已完成却白等」不再发生；FR-HEALTH-001/002 让超时失败被诚实识别、归类并纳入重发；FR-PREFLIGHT-001/002 让有问题的 provider 在派发前被拦下；FR-FORMAT-003 让异源建议不再因格式被整员丢弃；FR-BINDING-001/002 让质量事实不再谎报；FR-REBIND-004 让普通材料写入不再逼出重复确认与重发聚合；FR-CLEANUP-002 删除无消费者私有面。价值均为可观察行为，逐条落入验收账本。
4. **替代方案**：无更简单的替代被遗漏——决策 14 条拒绝方案（改配置删 provider、收敛 1 主力 + 1 备选、接缝映射表、回退 SKILL 内容、修正比较口径、改 waitMs 或接通 cancelManaged、把阈值对齐 600000、降级锚点校验或私有路径改告警或调低 minimum_heterologous、减少人工确认点、新建成本采集通道、恢复 M15 遥测五件套、只删谎报记录不修写入逻辑、复活 DEF-05、启用第三套材料写入实现）在 spec 第 10 节全部以「明确不做」落地，另含 D5（收窄 STAGE_FACT_MATERIALS）与 D6（冻结指针）两条否决；剩余修复路径已是经用户裁定的最简根修（读侧对称约 4 行、授权清单内最小修复、文档补记）。
5. **前提风险**：关键前提均成立或已有登记——对 3rd-review 的写入限定授权清单 6 文件、两个 config 不动、派发不减少（PFACT-016，越界即判 OI-08 失败）；跨仓信封演进顺序约束（WH 先容忍额外键、BR 再发新字段、两仓测试同批跑通）登记于 RISK-009；确认完整性语义变更经用户逐字裁定并登记例外清单第 9 条；守卫测试同批演进登记例外清单第 4、7、10 条；本 spec 的写入发生在 freeze-spec（step 10）之前，make-decision 的材料冻结语义（FR-REBIND-001）不构成对本 step 的冲突；worktree 环境类实现前提（依赖安装、跨仓测试环境）归 build-code 现场核验，本 spec 不预先断言。残余风险以 RISK-001~RISK-012 全量交接。

**需主会话裁定**：无方向级问题——五问结论均在决策授权内回答，未发现需要改方向或超出 `## 非目标` 的事项。非方向级观察（按纪律不在本 step 处置，不阻断推进）：detail 轨 D16 指出 G1/G3/G4 缺少 source_exact_excerpt 与 approval_hash 登记，属 decision-log 记录完整性事项，owner 为主会话的后续材料维护，与本 spec 的 FR/AC 链无关。

### build-spec 审查 finding 处置（F-a716f198ed97）

- **finding**：F-a716f198ed97（blocking）——FR-HEALTH-003 要求守卫测试 3rd-review/test/managed-session-lifecycle.test.mjs:58-71 同批演进，但 grill-G2 授权改动清单仅列 5 个生产文件、不含该测试，跨仓授权清单与协议测试变更未同步。
- **处置**：fixed（授权已获批）——用户本轮裁定原文「扩展授权：加入该守卫测试文件」：3rd-review 授权文件清单 5→6，新增 test/managed-session-lifecycle.test.mjs（守卫测试，随 OI-23/D4 同批演进并写明理由）；例外清单 9→10，第 10 条登记于 FR-GOV-003 下（spec 侧登记，decision-log 冻结不追写）。同步落点：来源与决策映射 OI-23 行（第 4、7、10 条）、PFACT-016、SCN-012、FR-HEALTH-003、FR-GOV-007、AC-GOV-007、RISK-008、plan-ceo-review 第 2/5 条、§13 跨仓协作节与全篇计数。

## 13. 业务影响与回归范围

### wh-review 审查链路（等待、预检、健康、格式、绑定）

- **既有行为**：等待 20 分钟上限抛 REVIEW_WAIT_EXCEEDED 不 cancel；预检只做静态可判定项；轮询只看 current.state；输出顶层键恰为 findings 否则失败；非终态信封必需键外的键被拒；review 事实可回落 evidence_refs 首条。
- **本需求影响**：到期前终态复检、复用守卫、五类预检拦截、非终态成员级事实消费、格式宽容、两轨事实本轨绑定。
- **回归路径**：SCN-001 正常审查全链路；SCN-002 终态复检；SCN-003 复用守卫；SCN-005 预检拦截；SCN-006 健康检测；SCN-007 误杀修复；SCN-008 格式样本；SCN-009 单轨提交两镜像。
- **验收**：AC-WAIT-001/002、AC-HEALTH-003/004、AC-PREFLIGHT-001/002、AC-FORMAT-001~004、AC-BINDING-001/002

### 3rd-review 跨仓协作（授权 6 文件）

- **既有行为**：agy 超时伪装成模型无输出；重发对 single_round/full_only 关闭；attempts[0] 进程级判定；非终态不带 group。
- **本需求影响**：A+B 根修、超时归类与重发、三处 broker 修复、attempt 事实一致、非终态成员级事实、成员级越界不连坐。
- **回归路径**：agy 最小复现、managed 审查全生命周期、守卫测试新边界。
- **验收**：AC-HEALTH-001/002、AC-BROKER-001~004、AC-HEALTH-003、AC-FORMAT-001

### stage 运行时与收口确认

- **既有行为**：确认按 material_revision + snapshot_tree 强判等；build-plan 下游合法改写 tasks.md 触发重绑。
- **本需求影响**：D4 读侧对称豁免执行记录区改写与纯快照变化；make-decision 材料冻结语义；build-spec/build-plan 文档补记。
- **回归路径**：SCN-010 三类变化场景判定；human-confirmation-v3 测试新边界。
- **验收**：AC-REBIND-001~004

### skill bundle 声明与检查基线

- **既有行为**：check-skill-closure exit 1、smoke-local-skill-dispatch exit 1。
- **本需求影响**：4 个声明文件 9 行值对齐 + 约 +10 行披露措辞补回；wh-review 改动同步重算 bundle 与 catalog 哈希。
- **回归路径**：两检查转绿；stage-reflection-wiring 第三条回归；verify-structure 与 run-checks 不劣化。
- **验收**：AC-CLEANUP-004、AC-GOV-004

- **可能受冲击的业务规则**：净减或持平（例外清单 10 条外）；7 条审查红线；五阶段流程与人工确认点；写入面事实；跨仓授权边界。
- **明确无影响**：specs/archive/** 字节与历史 provenance；两个 config 文件；provider 派发数量与覆盖；每阶段审查标准与 prompt；页面与前端（零页面）；M15 遥测面（不恢复）。
