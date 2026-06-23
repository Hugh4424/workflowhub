# 功能规格：M5 质量机制（quality mechanism）

**功能名**: `m5-quality-mechanism`
**来源用户故事**: agenthub-extraction-program roadmap M5
**需求权威源**: `artifacts/decision-log.md`（9 决策，用户 2026-06-23 批准）
**依赖**: M3（窄契约）+ M4（execution-record / fact 键）
**状态**: 草稿

## 速读卡（30 秒看懂这个需求）

**一句话需求**：给 workflowhub 装一套零消耗的质量观测层——物理事实自动落进现有记录、边界状况结构化确认三态放行、gate 三类守住"只记不挡"、失败靠结构化结果传播而非崩溃。

**核心改动点**（4 条）：
- fact collector：4 个零开销物理事实（exit_code / git_sha / files_changed / review_invoked）写进 M4 execution-record 已有 facts 键，复用不新建文件。
- stage 边界确认：缺失/失败/unknown 三态各能选"继续"并记原因，纯记录非门；读取接口锁死防孤儿。
- gate 三类：质量门=0（CI 扫描守住）/ fact collector 只记不挡 / 不可逆操作人工确认（删/push/merge/归档四类，超时记"未确认"后仍继续）。
- stage_result 最小 schema：自造完整七字段（status/error_code/retryable/facts/missing_items/user_decision/reason），护栏是 spec 约定，绝不做成运行时 gate。

**诚实声明（D5a）**：M5 去 blocking 放弃了"推进前拦截缺陷"的预防能力，换成"事后记录+浮现"的观察能力，二者不等价，不自欺。

**验收信号**：造"测试没跑"场景，流程能继续推进 + facts 里能查到遗漏；出现任何质量类 blocking 即判失败。

## Clarifications

### Session 2026-06-23

- Q: stage_result 的 facts 字段装哪些物理事实？ → A: 只装当次 stage 相关的事实子集（最小够用，非全装 4 个；stage_result 是失败传播契约，下游要的是这次失败的事实快照，全装违背 YAGNI）。
- Q: FR-FACT-002 说 review_invoked 来自"现有 journal 事件"，但 workflowhub 现状没有 journal，来源不存在怎么办？ → A: review_invoked 改从 M4 已有 execution-record 推导（同一条记录里就有该 stage 跑没跑审查的痕迹），不新建 journal（守 ponytail 零新文件）；推导不到时记 `false` + stderr 告警（守"源不可达标 gap、不假绿"）。FR-FACT-002"零开销来源"语义不变，仅来源载体从 journal 改为 execution-record。

## 1. 问题陈述

M3 给窄契约（stage 间传 {component_id, output_path}，失败裸 throw 无结构化错误）；M4 给指标双写管道 + execution-record（facts 键为空地）+ "只记不挡"铁律，但只采语义层指标，未采物理事实。workflowhub 现有 7 个 check 全为合规/结构类 blocking，零质量类 blocking（这是对的），但缺"事实观测"和"结构化失败传播"两块。M5 要把质量靠记录不靠拦路落成代码，且绝不重蹈 agenthub 记录臃肿覆辙（实证：单 task events.jsonl 632KB/3421 行，63% 是噪音）。

## 2. 背景、目标和边界

### 背景

agenthub 历史里最大的问题是记录太多太重——63% 是 hook 噪音，真物理事实仅占 6%。M5 的核心设计取向是最小切口：复用 M4 已有的 execution-record + facts 键，只加 4 个零开销字段，不新建任何文件。gate 三类遵循 D7 决策：质量门=0 守住别新增、fact collector 只记不挡、不可逆操作只在真危险点问人。

### 目标

- 做完后，每个 stage 执行完有 4 个物理事实可查（exit_code / git_sha / files_changed / review_invoked），无额外 token/时间消耗。
- 做完后，stage 交接时遇到三态（缺失/失败/unknown）均能结构化确认放行，agent 读取接口有明确入口防孤儿。
- 做完后，skill 结构化失败通过 stage_result 七字段传播，下游能读 error_code / retryable / missing_items 做决策，而不是盲目崩溃。

### 非目标（明确不做）

- 不做"默认安全动作+事后撤销"机制（依赖软删/撤销基础设施，M5 无此基础，超范围）。
- 不把 fact collector 物理事实分开成独立文件（违背"别搞太多文件"）。
- 不强制改写所有现有 skill 用 stage_result（裸 throw 处不动，stage_result 是新增可选结构化失败形状）。
- 不复用平台原生错误形状当 stage_result（字段超出标准 JS Error，技术验证否决）。

## 3. 用户场景和用例

> 这里的"用户" = workflowhub agent / 运维者；"系统" = M5 质量机制。

### 场景一：正常 stage 执行，facts 隐形落盘

Given 某 stage 正常执行完，When 采集触发，Then exit_code / git_sha / files_changed / review_invoked 四字段自动写进该 stage 对应的 execution-record.facts 键，对主流程无额外交互、无可感知耗时；fact 里能查到这条记录即通过。

### 场景二：测试没跑（失败场景）

Given 某 stage 测试被跳过（exit_code 不为 0 或 review_invoked=false），When stage 交接，Then 流程能继续推进；facts 里能查到"测试没跑"这个遗漏；流程被 BLOCK 即失败。

### 场景三：三态各一例（边界场景）

Given stage 边界出现"缺失"状态，When agent 读取边界确认接口，Then agent 能选"继续"并记录原因；选择和原因都落进记录。同理对"失败"态和"unknown"态各验一次；任一态卡住推进即失败。

### 场景四：skill 返回 failed，下游读到结构化错误

Given 某 skill 返回 stage_result 且 status=failed，When 下游读取，Then 能从 stage_result 取到 error_code / retryable / missing_items 三个字段并据此决策继续；拿不到任一字段即失败。

### 场景五：不可逆操作确认（边界场景）

Given agent 准备执行删文件操作，When M2 path guard 检测到此操作，Then 系统询问人工确认；确认后执行，记录"已确认"；超时或拒绝后记录"未确认"，但流程仍能继续（不 BLOCK）；超时后被 BLOCK 即失败。

### 场景六：fact collector 被改成 blocking（失败场景）

Given 有人把 fact 采集失败写成 blocking check，When 扫描，Then 该违规能被检出；检出失败即防复发机制失效。

### 场景七：stage_result schema 被用在 skill 运行时拦流程（失败场景）

Given stage_result schema 被用作 skill 运行时拦截门（而非 CI 格式校验），When 扫描，Then 该违规能被检出；CI 层格式校验是合规的、不在此列；仅运行时拦截才触发。

### 场景八：不可测指标当自动 gate（失败场景）

Given 有人把类似"够小"的阈值悬空当自动 gate，When 扫描，Then 能检出该违规；检出失败即防复发机制失效。

### 场景九：无遗漏 stage，fact 采集字节数可算出（边界/观察场景）

Given 正常无遗漏 stage 执行，When 查看 fact 采集对主流程上下文新增的字节数，Then 系统能算出并记录该数值（V5a，可测观察项）；无法算出或冒出额外交互即失败。是否"够小"由人拍阈值，不设自动 gate（V5b）。

### 状态覆盖清单

| 状态 | 含义 | 覆盖场景 |
|------|------|---------|
| 正常采集 | facts 四字段隐形落盘 | 场景一 |
| 采集遗漏可查 | 测试没跑但流程继续 | 场景二 |
| 三态放行 | 缺失/失败/unknown 各能继续 | 场景三 |
| 结构化错误传播 | stage_result 七字段下游可读 | 场景四 |
| 不可逆确认 | 真危险点问人后继续 | 场景五 |
| 防复发-fact blocking | 采集改阻断能被检出 | 场景六 |
| 防复发-schema gate | 运行时拦截能被检出 | 场景七 |
| 防复发-不可测 gate | 悬空阈值当 gate 能被检出 | 场景八 |
| 字节数可算 | 采集开销量化可观察 | 场景九 |

## 4. 功能需求

> **溯源规则**：每条 FR 后标对应 decision-log 决策编号，来源为 M5 decision-log（9 决策）。

#### 叙述层（给人读）

M5 干四件事：**采事实**——每个 stage 结束时顺手把 4 个物理事实塞进已有的 execution-record.facts 键，零额外文件、零额外时机，完全隐形。**结构化边界**——stage 交接遇到三态时有明确接口让 agent 选"继续"并记原因，接口固定不走孤儿路径。**守 gate**——CI 跑扫描确认质量类 blocking 数量=0，fact collector 只记不挡，不可逆操作只在四种真危险（删/push/merge/归档）问人，超时仍放行只记事实。**传错误**——skill 结构化失败通过七字段 schema 从上游传到下游，下游不用盲目崩溃。这四件事有两条铁律贯穿：一切都是观测不是拦截；schema 护栏写在 spec 约定里，绝不做成运行时 gate。

#### 编号字段层

### fact collector（FACT）

- **FR-FACT-001**：系统须在每个 stage 执行结束时，自动采集 exit_code / git_sha / files_changed / review_invoked 四个物理事实，写入该 stage 对应的 M4 execution-record 的 facts 键；不新建任何文件，不新增采集时机。来源：决策 1/2。
  - **场景**：Given stage 执行完，When 采集，Then execution-record.facts 含四字段，execution-record 文件已存在无新建。
  - **场景**：Given facts 写入，When 检查副作用，Then 无额外模型调用、无额外人工交互。
- **FR-FACT-002**：四个物理事实的采集来源须为进程结束时顺手得到的零开销来源——exit_code 来自进程退出码，git_sha 来自当次 git 提交哈希，files_changed 来自同一次 git 调用的文件列表，review_invoked 从 M4 已有 execution-record 推导（同一条记录里就有该 stage 跑没跑审查的痕迹；workflowhub 现状无 journal，不新建 journal），不新增采集入口；推导不到记 `false` + stderr 告警。来源：决策 1 + Clarification（见上）。
  - **场景**：Given 一次 stage，When 采集 review_invoked，Then 从该 stage 的 execution-record 推导得出（推导不到记 false），不新增采集入口、不读 journal。
- **FR-FACT-003**：facts 键只装这 4 个机器事实，保持干净；采集失败（如 git 命令失败）须发可观测告警但不阻断 stage 推进。来源：决策 2 / D7 铁律。
  - **场景**：Given git_sha 采集失败，When stage 仍推进，Then 流程继续 + 有可观测告警 + facts.git_sha 标缺口而非填零。

### stage 边界结构化确认（BOUND）

- **FR-BOUND-001**：stage 交接时，若检测到缺失/失败/unknown 三态之一，系统须通过固定的 agent 读取接口提供结构化确认——agent 能选"继续"并记录选择原因；三态各自能放行，任一态卡住推进即违规。来源：决策 7。
  - **场景**：Given 边界状态=缺失，When agent 读取接口，Then 能选"继续"并记原因；stage 推进不受阻。
  - **场景**：Given 边界状态=failed，When agent 读取接口，Then 同上。
  - **场景**：Given 边界状态=unknown，When agent 读取接口，Then 同上。
- **FR-BOUND-002**：agent 的读取接口和触发时机须在边界确认产出物里锁死，验收须证明"事实真被 agent 读到"而非孤儿记录（即确认结果有迹可查）。来源：决策 7（note 5 防孤儿）。
  - **场景**：Given 边界确认触发，When agent 读取并做出选择，Then 选择和原因落进可查询的记录，非孤儿。
- **FR-BOUND-003**：边界确认与不可逆操作确认须同 M2 check-path-guard 协同，复用已有 path guard，不新建确认机制。来源：决策 8a。
  - **场景**：Given 边界确认触发，When 与 path guard 协同，Then 调用 M2 已有接口，不另建新机制。

### gate 三类（GATE）

- **FR-GATE-001**：质量门=0——CI 须扫描全部 gate 并确认质量判断类 blocking 数量为零；每次新增 gate 须同步更新扫描断言，确保"发现就红"而非恒绿空扫。来源：决策 5。
  - **场景**：Given 现有全部 gate，When CI 扫描，Then 质量类 blocking 数量=0。
  - **场景**：Given 故意新增一个质量类 blocking，When CI 扫描，Then 扫描结果变红。
- **FR-GATE-002**：fact collector 须为"只记不挡"——fact 采集失败只发告警，不设任何 blocking 检查。来源：决策 5 / D7。
  - **场景**：Given 采集 facts 时失败，When stage 推进，Then 流程不被 BLOCK，只有告警。
  - **场景**：Given 有人把采集失败写成 blocking，When FR-GATE-001 扫描，Then 被检出。
- **FR-GATE-003**：不可逆操作人工确认范围只含四类：删文件 / git push / merge / 归档；其他操作全隐形不问。来源：决策 6。
  - **场景**：Given 删文件操作，When path guard 检测，Then 触发人工确认。
  - **场景**：Given 非四类操作（如修改文件），When path guard 检测，Then 不触发确认，完全隐形。
- **FR-GATE-004**：不可逆操作确认须"只卡是否处置，永远能继续"——确认超时或拒绝后，记录"未确认"事实并仍允许推进，不 BLOCK 流程。来源：决策 6。
  - **场景**：Given 删文件确认超时，When 后续推进，Then 记"未确认"且流程继续，不 BLOCK。

### stage_result schema（RESULT）

- **FR-RESULT-001**：系统须有 stage_result 最小 schema，完整七字段一个不漏：status / error_code / retryable / facts / missing_items / user_decision / reason。schema 放 contracts/ 目录，对齐现有 contract 格式（version + validated_by_stage + required_fields[]），不引 AJV。来源：决策 3。
  - **场景**：Given stage_result schema 定义，When 校验七字段，Then 全部存在且各字段类型符合约定。
  - **场景**：Given 七字段任一缺失，When 校验，Then 判不合格。
- **FR-RESULT-002**：七字段语义约束——status 枚举（成功/失败/unknown）；error_code 字符串标识失败类型；retryable 布尔（此失败是否可安全重试）；facts 形状复用 execution-record 先例（type:object），**只装当次 stage 相关的物理事实子集，非全装 4 个**（Clarifications 2026-06-23 定）；missing_items 数组（缺少什么让下游知道该补什么）；user_decision 布尔或枚举（是否有过人工介入决策）；reason 面向 orchestrator 的解释字符串（非 debug message）。来源：决策 3。
  - **场景**：Given status 取枚举外的值，When 校验，Then 判不合格。
  - **场景**：Given reason 为空，When 下游读取，Then 下游无法理解失败原因，判不合格。
- **FR-RESULT-003**：stage_result 七字段护栏是 spec 约定，绝不做成运行时 gate（否则护栏自身变质量 blocking 违反 D7/FR-GATE-001）；CI 层对 schema 格式合规做校验是正当结构检查，不受此限；被限的是"schema 被用作拦截 skill 运行时继续推进"。来源：决策 4。
  - **场景**：Given stage_result schema 被写成运行时 blocking gate，When 扫描，Then 检出违规。
  - **场景**：Given CI 对 schema 做格式校验，When 判定，Then 属合规检查不属违规。
- **FR-RESULT-004**：下游须能从 stage_result 读取 error_code / retryable / missing_items 三字段并据此决策；stage_result 为新增可选形状，现有裸 throw 处不强制改写。来源：决策 3/4。
  - **场景**：Given 上游 skill 返回 status=failed stage_result，When 下游读取，Then 三字段可达且非空。

## 5. 模块划分

> 只说各块职责和配合方式，不写实现类名。

### fact collector 适配层

- **负责什么**：在 stage updateOwnResult 时机把 4 个物理事实写进 execution-record.facts 键；失败时发告警但不抛拦截异常。
- **对外接口**：被 M4 updateOwnResult 钩子触发，接收进程退出码 + git 上下文。
- **依赖谁**：M4 execution-record 结构（复用 facts 键，且 review_invoked 从同一 execution-record 推导）。无 journal 依赖（workflowhub 现状无 journal）。
- **测试边界**：分两层——**单元测试**喂固定进程上下文进、查 execution-record.facts 出（单测本就隔离，不搭完整 stage 环境）；**验收（V1）**仍须真跑活流程，把 facts 写进真实 execution-record 并读回断言（非隔离 fixture，遵 decision-log 决策 8b）。两层不冲突：单测验逻辑、验收验真实流程闭合。

### stage 边界确认模块

- **负责什么**：暴露固定读取接口，接收三态输入，输出结构化确认选项；把选择 + 原因写进可查记录。
- **对外接口**：agent stage 交接时调用；与 M2 path guard 接口协同。
- **依赖谁**：M2 check-path-guard（复用确认机制，不新建）。
- **测试边界**：三态各一例独立可测；防孤儿须真跑活流程验。

### gate 扫描（CI）

- **负责什么**：CI 跑扫描，统计质量类 blocking 数量；结果须可红。
- **对外接口**：CI 调用，输出质量类 blocking 计数。
- **测试边界**：故意注入一个质量类 blocking 验扫描变红（防假绿）。

### stage_result schema 定义

- **负责什么**：维护 contracts/stage-result.contract.json（七字段 + 类型约定 + CI 格式校验）；护栏在 spec/contract 层，不进运行时。
- **对外接口**：CI 格式校验；spec 约定供实现参照。
- **测试边界**：七字段齐全性 + 格式合规 CI 校验；运行时拦截专项扫描。

## 6. 关键实体

- **execution-record.facts**（复用 M4）：
  - `exit_code`：进程退出码，整数，零开销读进程结束状态。
  - `git_sha`：当次 git 提交哈希，字符串，同一次 git 调用顺手得。
  - `files_changed`：本次变更文件列表，字符串数组，同 git_sha 一次调用。
  - `review_invoked`：本 stage 是否调用过审查，布尔，从 M4 execution-record 推导（推导不到记 false），不读 journal。
- **边界确认记录**（新增，轻量）：
  - `boundary_state`：三态枚举（missing / failed / unknown）。
  - `decision`：agent 选择（继续 / 补跑 / 放弃）。
  - `reason`：选择原因，字符串，必填。
  - `timestamp`：事实时间戳。
- **stage_result schema**（新增）：
  - `status`：枚举（success / failed / unknown）。
  - `error_code`：失败类型标识符，字符串。
  - `retryable`：是否可安全重试，布尔。
  - `facts`：当次 stage 相关物理事实子集（非全装 4 个），object，复用 execution-record 形状。
  - `missing_items`：缺少什么，字符串数组。
  - `user_decision`：是否有人工介入决策，布尔或枚举。
  - `reason`：面向 orchestrator 的解释，字符串。

## 7. 不做和隐性必达

### 明确不做

- 不做"默认安全动作+事后撤销"机制（超范围，留未来里程碑）。
- 不把 fact collector 物理事实分开成独立文件。
- 不强制改写所有现有 skill 用 stage_result。
- 不复用平台原生错误形状（字段超出，技术验证否决）。
- 不把任何质量判断做成运行时 blocking gate。

### 隐性必达

- 四个物理事实对主流程零额外消耗（零模型调用、零额外人工交互）。
- 边界确认记录不走孤儿路径——agent 读取接口固定，事实有迹可查。
- 不可逆确认超时后必须放行（不 BLOCK），只记事实。
- stage_result 护栏只在 spec/CI，不进运行时拦截。
- 所有验收必须真跑活流程，非隔离 fixture（decision-log 决策 8b）。

## 8. 验收清单

> 直接对应 decision-log 第 7 节 V1-V7，含 V5a/V5b 拆分、V6 三具体坑铁律。每条验收命令提交前须构造"声明为假"情形确认它会红（防假绿）；所有验收必须真跑活流程，非隔离 fixture。

- **V1 不卡死**：造"测试没跑"场景（exit_code≠0 或 review_invoked=false），流程能继续推进 + execution-record.facts 里能查到这个遗漏；流程被 BLOCK 即失败。（防假绿：把 facts 写入改 BLOCK 后验 V1 应红）
- **V2 质量门=0**：CI 扫描实现，质量类 blocking 数量=0；出现任一即失败。（防假绿：故意注入质量类 blocking 后扫描应红）
- **V3 三态放行**：缺失/失败/unknown 各造一例，都能选"继续"并记原因；任一态卡住即失败；须真跑活流程，非隔离 fixture。（防假绿：把某态处理改 BLOCK 后验该态应红）
- **V4 错误传播**：造一个 skill 返回 status=failed，下游能读到 error_code/retryable/missing_items 并继续；拿不到任一字段即失败；须真跑活流程。（防假绿：把字段之一砍掉后验 V4 应红）
- **V5a（可测，作 gate）**：跑正常无遗漏 stage，算 fact 采集对主流程上下文新增的字节数——能算出并输出这个数 + 无额外人工交互即通过；算不出或冒出交互即失败。（防假绿：字节数计算逻辑失效后验 V5a 应红）
- **V5b（仅观察，不设硬 gate）**：V5a 算出的字节数是否"够小"由人拍阈值；不把"< 某悬空阈值"当自动 gate；此项不阻断验收，仅作观察记录。
- **V6 防复发（三坑）**：
  - V6①：fact collector 被改成 blocking check 时能被检出；检出失败即防复发机制失效。（防假绿：故意注入采集 blocking 后验 V6① 应红）
  - V6②：stage_result schema 被用在 skill 运行时拦流程继续时能被检出（CI 层格式校验不在此列）；检出失败即失败。（防假绿：故意写运行时 gate 后验 V6② 应红）
  - V6③：不可测指标当自动 gate（如 V5 阈值悬空）时能被检出；检出失败即失败。（防假绿：故意加悬空阈值 gate 后验 V6③ 应红）
- **V7 记录本身=交付**：验收判据是"事实有没有记下、三态能否放行"，不是"某质量指标达没达标"；任何以质量达标作为验收门槛的条件均视为违规。

## 9. 未决问题和风险

- **stage_result.facts 字段子集**：✅ 已决（Clarifications 2026-06-23）——只装当次 stage 相关子集，非全装 4 个。
- **最大风险**：把"只记不挡"做歪成 blocking 门（M0 历史被 codex 三轮推歪过）——V2/V6 防复发验收是主要防线。

## 10. 影响范围（业务性质）

> 本需求交付物全为 workflowhub 新增能力，不改 agenthub 既有实现。只列业务影响，不写文件路径/代码符号。

- **受影响功能：M4 execution-record（facts 键）**
  - 既有行为：M4 execution-record 已建，facts 键为空地。
  - 本需求影响：M5 fact collector 写进 facts 键的 4 个物理事实；不新建文件，不改 execution-record 其他字段。
  - 回归要点：验证 execution-record 其他字段（进度/指标/反馈等六类键）在 M5 接入后保持不变；facts 键写入失败不阻断 execution-record 整体写入。
- **受影响功能：M2 check-path-guard**
  - 既有行为：M2 path guard 已交付（specs/archive/m2-microkernel），提供路径守护接口。
  - 本需求影响：M5 不可逆操作确认 + 边界确认复用 M2 接口，不新建确认机制；M2 接口调用频次增加（四类不可逆操作触发点）。
  - 回归要点：验证 M2 path guard 原有行为在 M5 接入后不变；新增触发点覆盖仅四类（删/push/merge/归档）。
- **受影响功能：workflowhub CI**
  - 既有行为：现有 CI 跑结构校验 + 聚合冒烟（M4 新增）。
  - 本需求影响：M5 新增质量类 blocking 扫描断言 + stage_result schema 格式校验两类 CI 用例。
  - 回归要点：验证新增 CI 用例在故意注入坏情况时能红（防假绿）。
- **可能受冲击的业务规则**：守恒铁律"只记不挡"——M5 fact collector / stage_result 护栏任何字段都不得成为运行时拦截推进的门，须保持不破（见 FR-GATE-001/002/FR-RESULT-003/V2/V6）。
- **明确无影响**：agenthub 既有 gate/审查/采集实现完全不碰；M5 代码全在 workflowhub 独立仓。

## 影响范围业务影响双向核（FR-SRC-TRACE）

decision-log 中涉及"改动/新增已有能力消费关系"的决策，均已在第 10 章列出对应影响：
- 决策 2（复用 M4 execution-record facts 键）→ 第 10 章"受影响功能：M4 execution-record"。
- 决策 8a（path guard 协同）→ 第 10 章"受影响功能：M2 check-path-guard"。
- 决策 5（CI 扫描守住质量门=0）→ 第 10 章"受影响功能：workflowhub CI"。
- 决策 5/D7（只记不挡）→ 第 10 章"可能受冲击的业务规则"。
- 决策 9（D5a 诚实声明）→ 速读卡"诚实声明"段。

## 审查合同影响（design-reviewer-contract）

本需求**不涉及 design-reviewer-contract 改动**——M5 是 workflowhub 新增能力，不修改 agenthub 的审查合同、不新增审查维度、不改审查员职责。design-review 按现有 design-reviewer-contract 三轴（Problem Fit / Spec Quality / Boundary Safety）审本 spec 即可，无合同变更需同步。
