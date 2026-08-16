# 功能规格：WorkflowHub 高质量低成本异源审查

> `content_profile: "spec-content.v3"`。本文件只定义产品行为、边界和验收，不定义实现文件、代码符号或工程命令。

- **功能名**：WorkflowHub 高质量低成本异源审查
- **来源**：已确认的 `decision-log.md`，D-001..D-015
- **状态**：已接受并冻结（build-spec）

## 速读卡（30 秒）

- **一句话需求**：WorkflowHub 到达审查节点时，应按配置让独立 reviewer 高效寻找会伤害交付的真实问题，同时避免无关材料、重复复审、多层重试和假通过。
- **核心改动点**：
  - 五个正式 stage 和 mini-task 两面各自使用明确的对抗审查问题与最小材料边界。
  - 配置中的 reviewer 全部在独立上下文执行，失败、空 findings、同源和真实异源分开报告。
  - 只有审查语义输入真实变化才复审；状态和审查记录写回不触发 P5/T010 循环。
  - 用 ModelTest 对九个审查面做修改前后质量、可靠性、时间和 token 对照。
- **最大影响面**：WorkflowHub 五阶段和 mini-task 的审查行为、3rd-review 公共调度行为、ModelTest 离线发布评测。
- **验收信号**：九个审查面都达到绝对质量底线且不退步；严重 finding 更容易命中，失败和重复调用下降，P5/T010 状态写回不再调用 provider。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001 | D-001,D-010 | FR-AUDIT-001 / AC-01 | current / 三任务基线 | 原始账本只读保留 |
| R-002 | D-001,D-012 | FR-FOCUS-001..009 / AC-02 | current / 九面质量 | 无 |
| R-003 | D-010,D-012 | FR-EVAL-003 / AC-19 | current / 成本 | 无 |
| R-004 | D-001,D-010 | FR-EVAL-004 / AC-20 | current / AgentHub 对标 | 效果由评测关闭 |
| R-005 | D-001,D-004 | FR-PACKET-001..003 / AC-03..05 | current / packet | 无 |
| R-006 | D-001,D-008 | FR-OWNER-001 / AC-06 | current / 根因改造 | 无 |
| R-007 | D-009 | FR-FOCUS-001..009 / AC-02 | current / 审查角度 | 研究已完成 |
| R-008 | D-001 | FR-FINDING-001..003 / AC-07..09 | current / findings | 无 |
| R-009 | D-008,D-013 | FR-EXEC-001..006 / AC-10..13 | current / 失败恢复 | 无 |
| R-010 | D-014 | FR-AUDIT-001 / AC-01 | current / 独立调研 | 执行索引已保留 |
| R-011 | D-011..D-013 | FR-GOV-001..003 / AC-21..23 | current / 宪法维护 | 无 |
| R-012 | D-004 | FR-FRESH-001..003 / AC-14..15 | current / P5-T010 | 无 |
| R-013 | D-001 | FR-FOCUS-005 / AC-16 | current / necessity | 无 |
| R-014 | D-001 | FR-FOCUS-005 / AC-16 | current / Spec/Standards | 无 |
| R-015 | D-002,D-014 | FR-GOV-001 / AC-21 | current / 五阶段 | 无 |
| R-016 | D-002 | FR-REPORT-001 / AC-24 | current / 大白话交接 | 无 |
| R-017 | D-002 | FR-TRACE-001 / AC-25 | current / 来源追踪 | 无 |
| R-018 | D-002 | FR-SCENARIO-001 / AC-26 | current / 完整流程 | 无 |
| R-019 | D-014 | FR-TRACE-001 / AC-25 | current / 会话覆盖 | 无 |
| R-020 | D-014 | FR-GOV-001 / AC-21 | current / 新流程 | 无 |
| R-021 | D-006,D-007 | FR-MINI-001..004 / AC-17..18 | current / mini-task | 配置 route 待实施 |
| R-022 | D-014 | FR-GOV-001 / AC-21 | current / main 接续 | 已完成 |
| R-023 | D-014 | FR-TRACE-001 / AC-25 | current / 完整性复核 | 已完成 |
| R-024 | D-015 | FR-FINDING-004、FR-CLOSE-001..004 / AC-27..32 | current / verify-close 与 mini finding 一致性 | build-plan/build-code/verify-code |

## 1. 问题与紧迫性

当前 wh-review 能找到真实问题，但三个真实任务显示它把语义审查、材料治理、provider 调度和复审有效性混在了一起。结果是：reviewer 阅读远超当前问题所需的材料；大量 finding 只讨论材料、快照或流程；配置 reviewer 没有全部实际运行；输出错误和 provider 失败引发新 attempt；相同语义内容被重复审查；P5 写回 T010 状态会使旧审查自行过期。

这直接拉长 WorkflowHub 总执行时间并消耗大量 token。更严重的是，昂贵不等于高质量：build-code 能找到严重实现问题，但 direction、plan、integration 和 verify 的有效 finding 密度不稳定，失败和无效锚点会掩盖真实质量。

因此本需求不是“让 review 更严格”，而是重新划清职责：Host 做确定性检查，异源 reviewer 做对抗性语义审查，3rd-review 管 provider 生命周期，ModelTest 独立证明改造是否真的更好。

## 2. 背景、目标与范围

### 背景

- 三个真实任务共有 172 个 review attempt，已暴露宽 packet、重复复审、`SAME_SOURCE`、材料不完整、输出无效、慢尾和失败样本消失等问题。
- WorkflowHub 已有五阶段、四份当前材料、统一 wh-review 入口和 mini-task 两类专用 review kind。
- 3rd-review 已是公共 broker；WorkflowHub 不应重写 provider 启动、轮询、session 或 timeout。
- ModelTest 已有固定 subject、mutation、control、execution 和版本化评分资产，可作为离线前后对照基础。

### 目标

- 提高每个审查面的严重问题召回、finding 正确性和可行动性。
- 降低与交付无关 finding、无效锚点、格式失败、重复复审、token 和墙钟时间。
- 保持九个审查面各自不退步，不用总平均掩盖局部质量下降。
- 保持 WorkflowHub 宪法：review 是事实，不是推进许可证；四份材料和七类 public runtime 不变。

### 范围内

- WorkflowHub：九个审查面的合同、材料边界、finding 语义、确定性复审身份、处置和报告。
- 3rd-review：按配置执行 profile、隔离/异源事实、并发、错误分类、有限恢复和真实 usage/provenance。
- ModelTest：九面 baseline/candidate 资产、严格 matcher、重复运行、失败完整性、逐面比较和报告。
- 三个真实任务的全部 review 事实作为只读基线和回放样本。

## 3. 用户场景与状态覆盖

### SCN-001：正常审查并返回可行动 findings

- **角色**：执行 WorkflowHub stage 的 Agent。
- **Given**：当前审查面有完整且安全的语义输入，配置包含可运行 reviewer。
- **When**：Agent 调用唯一 wh-review 入口。
- **Then**：配置 reviewer 在独立上下文审查同一冻结主题；结果保留原始 finding、来源、usage、timing 和处置，不产生 pass 许可证。

### SCN-002：正常完成但没有 finding

- **角色**：Stage Agent。
- **Given**：provider 返回可信终态且 `findings: []`。
- **When**：WorkflowHub 聚合结果。
- **Then**：记录 `completed_no_findings`，不重试、不写 provider pass，也不自动声明 stage 完成。

### SCN-003：Host 在 dispatch 前发现结构错误

- **角色**：Stage Agent。
- **Given**：路径不安全、必需输入为空、hash 不匹配或材料键不允许。
- **When**：Host 构建审查请求。
- **Then**：返回明确 `structural_error`，provider 调用数为 0；Agent 可修复当前任务后重试。

### SCN-004：provider 不可用或输出无效

- **角色**：Stage Agent 与 3rd-review。
- **Given**：出现认证、启动、死亡、传输、timeout 或格式错误。
- **When**：broker 按错误类型处理。
- **Then**：只由 3rd-review 执行允许的有限恢复；最终仍失败则记录 `unavailable`，成功 reviewer 不重跑，失败不变成空 findings。

### SCN-005：配置多个 reviewer

- **角色**：WorkflowHub 配置维护者。
- **Given**：受信配置为当前 surface 列出 N 个 profile。
- **When**：一次审查开始。
- **Then**：WorkflowHub 提交完整列表，3rd-review 实际调度 N 个隔离执行；报告分开显示配置兑现、独立上下文和真异源数量。

### SCN-006：P5 审查后只写回 T010 状态

- **角色**：build-code Agent。
- **Given**：P5 语义对象已审查，随后只改变完成状态、时间、handoff 或 review ref。
- **When**：进入最终 aggregate。
- **Then**：确定性语义投影 hash 不变，旧审查仍适用，provider 调用数增加 0。

### SCN-007：真实语义输入改变

- **角色**：Stage Agent。
- **Given**：行为 diff、需求/决定、AC、接口/schema、迁移、配置、直接 consumer、测试/oracle、phase 范围、计划约束或 review 合同改变。
- **When**：重新计算当前 surface 投影。
- **Then**：hash 改变，旧审查如实 stale；只对受影响主题产生一次新审查。

### SCN-008：build-code Phase 审查

- **角色**：开发 Agent。
- **Given**：一个 Phase 的完整行为 diff、直接 consumer、测试和 AC trace 已冻结。
- **When**：每个配置 reviewer 审查该 Phase。
- **Then**：同一次调用依次检查 spec conformance、correctness、necessity；不按三轴重复组包或调用。

### SCN-009：build-code Integration 审查

- **角色**：开发 Agent。
- **Given**：全部 Phase 完成，最终净实现可读。
- **When**：执行一次 integration review。
- **Then**：只攻击完整用户流、接口和跨 Phase 接缝，不回放每轮 Phase 历史，不替 verify 做逐 AC 声明反查。

### SCN-010：verify 声明反查

- **角色**：验收 Agent。
- **Given**：当前实现、测试、断言、结果和全部 AC 可读。
- **When**：执行 verify review。
- **Then**：逐条沿 AC→实现→consumer→测试→断言→结果检查；弱 oracle、跳过和假绿保持可见。

### SCN-011：mini-task 设计审查

- **角色**：mini-task 执行者。
- **Given**：四份材料冻结，任务仍满足 mini-task 范围。
- **When**：调用 `mini_task.design`。
- **Then**：复用 spec+plan 公共角度并检查“是否仍够小”；缺 route 或 review 失败不能写 `passed`。

### SCN-012：mini-task 实施审查

- **角色**：mini-task 执行者。
- **Given**：当前实现、focused test、AC trace、真实用户结果、覆盖限制和风险可读。
- **When**：调用 `mini_task.implementation`。
- **Then**：复用 code+verify 公共角度并检查范围越界；只在真实修复或主题变化后允许一次受影响复审。

### SCN-013：九面 baseline/candidate 对照

- **角色**：发布评测者。
- **Given**：固定 subject、5 个隐藏缺陷、1 个 clean control、相同 reviewer/参数和两个版本绑定。
- **When**：每个 case、reviewer、版本运行 5 次。
- **Then**：逐 surface 输出质量、误报、执行率、失败、retry、token 和时间；任何一面退步都不能被平均数抵消。

### SCN-014：关键材料超过 provider 上限

- **角色**：Stage Agent。
- **Given**：去除无关和重复材料后，关键语义内容仍超过真实上限。
- **When**：Host 准备 dispatch。
- **Then**：返回 `unavailable/material_too_large`；不静默截断关键行为后声称完成。

### SCN-015：严重 finding 不修

- **角色**：用户与 Stage Agent。
- **Given**：存在 `major` 或 `blocking` finding，Agent 不准备修复。
- **When**：处置 finding。
- **Then**：只有用户对该具体风险的真实确认可形成 `accepted_risk`；否则保持 `needs_human`。

### SCN-016：verify 事实不完整时准备关闭

- **角色**：交付负责人。
- **Given**：测试和 review 有记录，但 finding 处置、AC、例外或 verify 人工确认任一缺失/失败。
- **When**：准备 task close。
- **Then**：明确列出缺少的事实并保持 `incomplete`；不能因为 provider 没有严重 finding 就关闭。

### SCN-017：材料写回但语义没有变化

- **角色**：build-code/verify-code Agent。
- **Given**：测试和 review 已绑定实现，随后只写回任务状态、时间、handoff 或 review 记录。
- **When**：重新聚合当前 verify 事实。
- **Then**：复用测试 receipt 和 review result，不重新调用 provider；当前质量事实重新绑定当前材料/交付快照后才能 close。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-008..010
- [x] **空态**：SCN-002
- [x] **错误态**：SCN-003、SCN-004、SCN-014
- [x] **加载态**：SCN-005；运行中只显示真实进行事实，不伪造结果
- [x] **取消态**：SCN-004；被取消或超时的 provider 为 `unavailable`，已完成成员保留
- [x] **边界态**：SCN-006、SCN-007、SCN-014、SCN-015、SCN-016、SCN-017
- [x] **权限态**：SCN-015；只有用户能接受具体严重风险
- [x] **竞态**：SCN-005；并行 reviewer 各自独立，聚合不覆盖成员结果

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：当前 WorkflowHub 有五个正式 stage 和统一 wh-review 入口。
  - **status**：`verified`
  - **证据或来源**：decision-log F-005、D-014；当前标准流程。
  - **关联**：FR-GOV-001、AC-21

- **PFACT-02**：mini-task design/implementation review kind 已进入 main，但用户配置没有对应两条 route。
  - **status**：`verified`
  - **证据或来源**：decision-log F-019、D-006、D-013。
  - **关联**：FR-MINI-001、FR-EXEC-001、AC-17

- **PFACT-03**：当前 mini-task review status 缺省行为可能写成 `passed`。
  - **status**：`verified`
  - **证据或来源**：decision-log“当前实现与本次目标的差距”。
  - **关联**：FR-MINI-003、AC-18

- **PFACT-04**：当前 wh-review 外层允许多次 fresh recovery 和同源 fallback，与本次单 owner、有限恢复目标不同。
  - **status**：`verified`
  - **证据或来源**：decision-log D-008、F-SA-005 处置。
  - **关联**：FR-EXEC-004..006、AC-12..13

- **PFACT-05**：当前 `verify-final` 仍绑定完整 snapshot，P5/T010 语义身份目标尚未实现。
  - **status**：`verified`
  - **证据或来源**：decision-log D-004、“当前实现与本次目标的差距”。
  - **关联**：FR-FRESH-001..003、AC-14..15

- **PFACT-06**：三个真实任务共有 172 attempts，存在大量 unavailable、`SAME_SOURCE`、重复 snapshot、packet 超限和无效 finding。
  - **status**：`verified`
  - **证据或来源**：decision-log AUDIT-001..003、task×surface 汇总和只读 review 目录。
  - **关联**：FR-AUDIT-001、FR-EVAL-003、AC-01、AC-19

- **PFACT-07**：ModelTest 已有七面固定 subject、每面 5 个单缺陷 mutation、1 个未独立验收的 reference control、不可变 execution、四项 projection 和历史 70/30 delivery-quality 公式；但当前 runner 每组合只跑一次、一次 prompt 混入 6 个 case、失败不进正式分母、matcher 不能严格证明命中目标 mutation，也没有 mini-task 两面和配对中位差。该 reference control 不能直接当作 gold-clean 样本统计误报。
  - **status**：`verified`
  - **review packet availability**：`unavailable`；build-spec 当前材料合同不允许附加三仓源码证据，reviewer 只能检查本规格与已确认决定的一致性。
  - **证据或来源**：ModelTest 当前 `9d195b01180955d7a52452f5bce576b5a67c01ca` 的 US-03/US-05 subject、mutation、runner、assessor、scorecard/evaluator 和 comparison schema 条件研究。
  - **关联**：FR-EVAL-001..004、AC-19..20、RISK-04

- **PFACT-08**：本需求没有 Web UI、移动端页面或新增 dashboard。
  - **status**：`not_applicable`
  - **不适用理由**：用户可见面只有现有 CLI、stage 汇报、review report/quality fact 和 ModelTest 报告。
  - **关联**：FR-REPORT-001、AC-24

- **PFACT-09**：当前 WorkflowHub 已有唯一 surface 路由和 required/optional/forbidden 材料矩阵，但同 adapter profile 会被本地有效 reviewer 计算排除，只有 phase 有总包上限，没有通用内容去重，外层最多重复整个 reviewer group 四次并可 same-source fallback。
  - **status**：`verified`
  - **review packet availability**：`unavailable`；同 PFACT-07。
  - **证据或来源**：WorkflowHub 当前 `249e2cd7ff84756fb9509d0716f013b5a94a75e8` 的 wh-review CLI、host config、material builder 和 review runner 条件研究。
  - **关联**：FR-OWNER-001、FR-EXEC-002、FR-EVAL-001、AC-06、AC-10、AC-19

- **PFACT-10**：当前 3rd-review `workflowhub-result.v2` 会按 adapter 名返回 `SAME_SOURCE`，没有统一 broker timeout、统一一次 fresh retry、统一一次同 session format repair、统一 usage schema 或公开 provenance；v1/v2 结果字段是精确集合，不能原地塞入新字段。
  - **status**：`verified`
  - **review packet availability**：`unavailable`；同 PFACT-07。
  - **证据或来源**：3rd-review 当前 `5c81c063728f4d0c9d7e6e16b6e9deb32c7e7ef9` 的 broker、config、health runner、adapter 和 98 项通过测试。
  - **关联**：FR-EXEC-001..006、FR-OWNER-001、AC-06、AC-10..13

- **PFACT-11**：mini-task 两类 review kind、合同和材料矩阵已存在，但生产配置没有两条 route；runner 可由调用方缺省写 `passed`，implementation review 后会重复执行 test command，close 对 AC trace 和 user result 的底层校验不足。
  - **status**：`verified`
  - **review packet availability**：`unavailable`；同 PFACT-07。
  - **证据或来源**：WorkflowHub mini-task runner、正式配置、合同、材料矩阵和 60 项通过测试的条件研究。
  - **关联**：FR-MINI-001..004、AC-17..18

## 5. 功能需求

### 审查基线与可追溯性（AUDIT/TRACE）

- **FR-AUDIT-001**：系统必须保留三个真实任务全部 review attempt/result/report 的原始事实，并提供 task×surface 汇总；未知耗时、token、retry 或原因不得估算。
  - **范围边界**：只读基线，不复制成第二份运行账本。
  - **依据**：R-001、R-010、PFACT-06
  - **场景**：SCN-013
  - **验收**：AC-01

- **FR-TRACE-001**：每条规格行为必须回到原始 R、已确认 D、场景和 AC；后续 stage 不得静默补产品方向。
  - **范围边界**：允许细化字段和测试，不允许新增未绑定行为。
  - **依据**：R-017、R-019、R-023、PFACT-01
  - **场景**：SCN-001
  - **验收**：AC-25

### 九个审查面的语义焦点（FOCUS）

- **FR-FOCUS-001**：direction 必须先独立重建问题，再揭示当前选择做反方论证和更小可逆方案搜索，最终只形成一个逻辑 review fact。
  - **范围边界**：不审实现方案和流程字段。
  - **依据**：D-009、PFACT-01
  - **场景**：SCN-001
  - **验收**：AC-02

- **FR-FOCUS-002**：detail 必须攻击决定的遗漏、矛盾、需求漂移和范围失控，不以 Talk/Grill 格式作为主要 finding。
  - **依据**：D-001、F-009
  - **场景**：SCN-001
  - **验收**：AC-02

- **FR-FOCUS-003**：build-spec review 必须攻击完整用户旅程、状态转换、失败恢复、幂等和假绿 AC，不重做产品方向。
  - **依据**：D-001、F-012
  - **场景**：SCN-001
  - **验收**：AC-02

- **FR-FOCUS-004**：build-plan review 必须重建 producer→consumer→验证→恢复因果链，寻找依赖、顺序、迁移和回滚断点。
  - **依据**：D-001、F-013
  - **场景**：SCN-001
  - **验收**：AC-02

- **FR-FOCUS-005**：code/phase 必须在每个 reviewer 的同一次调用中按 conformance→correctness→necessity 检查完整 Phase 主题。
  - **依据**：R-013、R-014、F-014
  - **场景**：SCN-008
  - **验收**：AC-16

- **FR-FOCUS-006**：code/integration 必须只审最终用户流、接口和跨 Phase 接缝，不重复 Phase 历史或 verify 的逐 AC 工作。
  - **依据**：D-001、F-014
  - **场景**：SCN-009
  - **验收**：AC-02

- **FR-FOCUS-007**：verify 必须逐条反查 AC→实现→consumer→测试→断言→结果，并对弱 oracle 和跳过项保持怀疑。
  - **依据**：D-001、F-015
  - **场景**：SCN-010
  - **验收**：AC-02

- **FR-FOCUS-008**：mini/design 必须组合 spec+plan 公共角度，并专门检查任务是否仍够小。
  - **依据**：D-006、D-007
  - **场景**：SCN-011
  - **验收**：AC-17

- **FR-FOCUS-009**：mini/implementation 必须组合 code+verify 公共角度，并专门检查实现是否越界。
  - **依据**：D-006、D-007
  - **场景**：SCN-012
  - **验收**：AC-18

### 审查材料（PACKET）

- **FR-PACKET-001**：每个 surface 必须只有一个明确材料 allowlist，区分 required、直接相关时 optional 和 forbidden。
  - **依据**：D-001、R-005
  - **场景**：SCN-001、SCN-014
  - **验收**：AC-03

- **FR-PACKET-002**：同一语义材料必须按内容 hash 去重，不得换名称重复嵌入；历史、transport 元数据、重复 maps 和无关 receipt 默认禁止。
  - **依据**：D-001、FND-DETAIL-003
  - **场景**：SCN-001
  - **验收**：AC-04

- **PFACT-12**：verify-code 的正式完成谓词包含完整测试、独立审查、finding 处置、AC、例外和人工确认；当前 task-close 只直接读取测试和独立审查，可能在 verify 仍不完整时准备关闭。
  - **status**：`verified`
  - **依据**：`runtime/stage/completion-predicates.mjs`、`core/task-close.mjs`、close 集成测试审查。
  - **场景**：SCN-016、SCN-017
  - **验收**：AC-27..32

- **FR-PACKET-003**：关键行为、直接接口/consumer、测试和断言不得因省 token 被摘要替代；仍超限时必须明确 unavailable，不能静默截断。
  - **依据**：D-001、D-012
  - **场景**：SCN-014
  - **验收**：AC-05

### finding 与处置（FINDING）

- **FR-FINDING-001**：reviewer 只返回可行动 finding，至少包含严重度、审查角度、精确锚点、问题、失败机制或用户后果、聚焦修正。
  - **依据**：D-001、R-008
  - **场景**：SCN-001
  - **验收**：AC-07

- **FR-FINDING-002**：reviewer 不得输出 pass、stage 完成许可或流程裁决；空 findings、provider 失败和质量完成必须是三种不同事实。
  - **依据**：D-001、D-013
  - **场景**：SCN-002、SCN-004
  - **验收**：AC-08

- **FR-FINDING-003**：Stage Agent 必须逐条保留原 finding 并记录 fixed、rejected_invalid、accepted_risk 或 needs_human；严重风险只能由用户接受。
  - **依据**：D-013
  - **场景**：SCN-015
  - **验收**：AC-09

- **FR-FINDING-004**：所有 canonical/reportable finding（普通和严重）都必须逐条进入 finding disposition；严重 finding 另外决定正式完成是否暂停。`accepted_risk` 必须有绑定当前 finding、review、snapshot 的真实用户风险确认；没有该确认时保持 incomplete，不能只靠 status 字符串通过。mini-task design 和 implementation 复用同一合同。
  - **依据**：D-015、R-024
  - **场景**：SCN-015、SCN-016
  - **验收**：AC-31、AC-32

### reviewer 执行与失败（EXEC/OWNER）

- **FR-EXEC-001**：reviewer 数量和 profile 必须完全来自受信配置；调用方不得动态增减、替换或 fallback 到未配置 reviewer。
  - **依据**：D-003、PFACT-02
  - **场景**：SCN-005
  - **验收**：AC-10

- **FR-EXEC-002**：一个请求必须唯一解析为一个 surface、一个合同、一个材料矩阵和一条 route；每个配置 profile 必须有独立执行事实，配置兑现率、独立上下文率和真异源率分别计算。非法的 stage/track/phase/review-kind 组合必须在 dispatch 前失败。
  - **route 失败**：九个正式 surface 都必须有 route；缺失或无效时 provider 调用为 0，只记录一次 `unavailable/configuration_error`，不得 retry、fallback、写 `passed` 或降为 `not_requested`。
  - **依据**：D-013、PFACT-09
  - **场景**：SCN-005
  - **验收**：AC-10

- **FR-EXEC-003**：同 adapter 名不等于同一上下文；每个 broker 启动的外部 profile 都按独立进程、workspace 和 native session 计为独立上下文，真异源再按受信 adapter/source identity 单独计算。只有 broker 能证明执行与宿主共享同一上下文时才可返回 `SAME_SOURCE`，不得按 adapter 标签猜测。
  - **配置加载**：每条 route 至少包含一个与 host provider 不同且上下文隔离的真异源 profile；否则配置无效、明确失败且不 dispatch。
  - **依据**：D-013
  - **场景**：SCN-005
  - **验收**：AC-11

- **FR-EXEC-004**：WorkflowHub 不得实现 provider polling、session 生命周期、第二 timeout 或叠加 retry；这些生命周期只属于 3rd-review。
  - **依据**：D-008、PFACT-04
  - **场景**：SCN-004
  - **验收**：AC-12

- **FR-EXEC-005**：配置/认证/route/packet 超限错误不重试；启动、死亡或可恢复传输错误最多一次新执行；语法/schema 格式错误最多一次同 session 修正；timeout 不自动重跑。每个 profile 必须从 3rd-review 受信配置得到正数墙钟 deadline，timeout 只终止该成员；WorkflowHub 不提供第二 timeout。
  - **依据**：D-008、D-013
  - **场景**：SCN-004、SCN-014
  - **验收**：AC-12

- **FR-EXEC-006**：聚合失败不得丢失或重跑已完成 reviewer；每个成员必须原样保留 provider/profile/model/config identity、material/contract/semantic identity、session/runtime、每次 attempt、provider 内部 retry 数、fresh execution retry 数、同 session repair 数、usage、timing、terminal status、error 和安全 provenance。未发生恢复的失败同样保留 attempt 和零计数；缺少可信 token telemetry 时 usage 为 `null`，不得估算。
  - **兼容边界**：3rd-review v1/v2 只读兼容；新增事实使用显式协商的新 result protocol，不双写、不从 broker 私有 runtime 补字段、不回填历史。
  - **依据**：D-008
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-13

- **FR-OWNER-001**：WorkflowHub、3rd-review、ModelTest 必须各自只承担审查语义、broker 生命周期、离线评测职责，并通过既有公开边界连接。
  - **依据**：D-008、D-011
  - **场景**：SCN-001、SCN-013
  - **验收**：AC-06

### 复审有效性（FRESH）

- **FR-FRESH-001**：每个 surface 必须对明确输入投影做规范化排序、稳定序列化并计算确定性 `semantic_hash`；投影必须包含版本和 review contract hash。
  - **依据**：D-004、PFACT-05
  - **场景**：SCN-006、SCN-007
  - **验收**：AC-14

- **FR-FRESH-002**：状态、时间、handoff、review/provider/retry/timing/ref 等记录字段不得进入语义投影；完整 Git tree 只作 provenance。
  - **依据**：D-004
  - **场景**：SCN-006
  - **验收**：AC-14

- **FR-FRESH-003**：只有投影中行为 diff、需求/决定、AC、接口/schema、迁移、配置、直接 consumer、测试/oracle、phase 范围、计划约束或 review 合同真实变化才允许普通复审；写回新 review fact 不得再次使自身过期。
  - **依据**：D-004
  - **场景**：SCN-006、SCN-007
  - **验收**：AC-15

### 正式验收与交付关闭（CLOSE）

- **FR-CLOSE-001**：verify-code 的正式完成和 task-close 必须使用同一组当前、已认证的质量事实：`full_tests_fresh=passed`、`independent_review=recorded`、`finding_dispositions=passed`、`acceptance_criteria=passed`、`exceptions=passed`、`human_confirmation=passed`。review 的 provider verdict 不是 pass 门槛；`recorded` 只表示真实审查事实已经记录，finding 处置另行决定完成性。
  - **依据**：D-015、FR-GOV-002
  - **场景**：SCN-016
  - **验收**：AC-27

- **FR-CLOSE-002**：close 必须逐条校验上述事实的 canonical ref、hash、类型、状态和当前 material/snapshot 绑定；缺失、失败、unavailable 或旧事实必须明确列为 incomplete，不能只检查测试和 review 两项。
  - **依据**：D-015
  - **场景**：SCN-016
  - **验收**：AC-28

- **FR-CLOSE-003**：测试 receipt 的实现身份与当前交付材料身份分开验证。只改变当前任务材料的记录字段时，可以复用同一 source digest、测试 receipt 和 semantic review result；代码、AC、oracle、接口或其他真实语义变化时，旧事实不得复用。当前交付快照仍必须被 close plan 绑定。
  - **依据**：D-004、D-015
  - **场景**：SCN-006、SCN-007、SCN-017
  - **验收**：AC-29

- **FR-CLOSE-004**：close confirmation 与 commit、merge、push、archive、cleanup 授权保持分离；verify 的人工确认不能替代不可逆操作授权，close confirmation 也不能替代 verify 的人工确认。
  - **依据**：D-015、FR-GOV-002
  - **场景**：SCN-015、SCN-016
  - **验收**：AC-30

### mini-task（MINI）

- **FR-MINI-001**：mini-task 必须有显式 design 和 implementation 两条受信 route，缺失时为 configuration unavailable。
  - **失败行为**：缺 route 时 provider 调用为 0，只记录一次 `unavailable/configuration_error`，不 retry、不 same-source fallback、不写 `passed` 或 `not_requested`。
  - **依据**：D-006、D-013、PFACT-02
  - **场景**：SCN-011、SCN-012
  - **验收**：AC-17

- **FR-MINI-002**：mini-task 两次专用审查替代同范围普通审查，不成为第六 stage、第二套材料或第二份完成记录。
  - **依据**：D-006、D-007
  - **场景**：SCN-011、SCN-012
  - **验收**：AC-17

- **FR-MINI-003**：mini-task 调用方不得提交 review status、自报 `passed` 或用缺省值制造通过；结果必须完整通过 canonical review schema，并绑定 task、review kind、material/semantic identity、snapshot provenance、provider provenance 和 findings。有效语义结果统一为 `recorded`，空 findings 仍是 `recorded`，unavailable/SAME_SOURCE 分别保持 unavailable/incomplete。
  - **依据**：D-013、PFACT-03
  - **场景**：SCN-011、SCN-012
  - **验收**：AC-18

- **FR-MINI-004**：implementation 必须消费一次性冻结的当前实现、完整净 diff、focused test receipt、逐 AC trace、真实用户结果、覆盖限制、跳过理由和剩余风险；review 写回后不得无条件重跑测试。每个适用 AC 恰有一条 expected/actual/status/实现锚点/test/evidence/coverage trace；用户结果必须有 method、scenario、expected、observed、oracle、snapshot 和 evidence ref/hash。只有真实修复或主题变化后可做一次受影响复审。
  - **依据**：D-007
  - **场景**：SCN-012
  - **验收**：AC-18

### ModelTest 前后评测（EVAL）

- **FR-EVAL-001**：发布新的、版本化的九面 benchmark bundle；每面恰有固定 subject、5 个单缺陷 mutation 和控制样本。控制样本必须明确标记为 `gold_clean` 或 `unlabeled_control`：只有经过独立验收、可回读接受事实的 `gold_clean` 才能用于误报率和 delivery-quality；旧 reference control 保持 `unlabeled_control`，只能报告 finding rate，不能伪装成干净样本。baseline/candidate 使用中性盲名并交错运行，使用完全相同的 case bytes/hash、隐藏 oracle、配置 reviewer、参数、timeout 和评分卡，只改变绑定的三仓版本；旧七面资产和历史 projection 字节不变。
  - **执行边界**：一个 case 是一次完整端到端 review 交易，reviewer 不得看到同面的其他 case；direction 内部 reveal、格式修正和有限恢复都计入该 leg 的 attempt、token 和墙钟，不增加计划分母。
  - **依据**：D-010、D-011、PFACT-07
  - **场景**：SCN-013
  - **验收**：AC-19

- **FR-EVAL-002**：每个 case、reviewer、版本必须运行 5 次；计划 leg 唯一键为 `surface/case/reviewer/version/run_index`，每个计划 leg 都必须留下不可变 attempt fact。相同 `surface/case/reviewer/run_index` 的两版都有效才配对；每个 case×reviewer 单元至少 4 对有效才计算中位差，并保留五次原值与最差值。
  - **依据**：D-010、D-012
  - **场景**：SCN-013
  - **验收**：AC-19

- **FR-EVAL-003**：每面必须分别报告严重缺陷召回、finding 正确性/严重度/可行动性、`gold_clean` 误报率、`unlabeled_control` finding rate、无关 finding、执行率、失败分类/retry、墙钟、token 和每个有效 finding 成本。目标 mutation 自动命中必须同时满足 mutation identity、允许 defect class、有效材料锚点、失败机制和版本化 severity 映射；同段其他问题只算 extra finding，多候选进入盲人工复核。
  - **评分边界**：WorkflowHub `blocking|major` 映射 ModelTest `critical|major` 为严重；只有经过独立验收的 `gold_clean` 样本才把 finding 记作误报。`unlabeled_control` 的 finding 只作为诊断事实，不进入误报率或 delivery-quality。失败保留在固定执行率分母，但不伪造质量 0。
  - **依据**：D-010、D-012
  - **场景**：SCN-013
  - **验收**：AC-19

- **FR-EVAL-004**：每个 candidate surface 的有效 leg 按本次 bundle manifest 明确绑定的版本化 scorecard/evaluator 生成独立 projection；ModelTest 只记录质量、可靠性和成本事实，不在 WorkflowHub 另造评分控制面，也不把固定分数当作继续、修复或正式交付的强制闸门。每面必须分别报告严重缺陷召回、finding 正确性/严重度/可行动性、`gold_clean` 误报、`unlabeled_control` finding rate、无关 finding、执行率、失败/retry、token、时长和每个有效 finding 成本；没有 `gold_clean` 时 delivery-quality 保持 `null/inconclusive`，但召回、控制样本 finding rate、执行和成本仍可独立报告。有配对时再报告相对变化，配对不足、provider 失败或 telemetry 不可得时保持 `inconclusive/unavailable`。报告必须明确指出质量提升、质量退步、成本变化、稳定性变化和未知项；不生成跨 surface 总排名，也不因单一分数差距阻塞 WorkflowHub 继续或 close。旧 comparison 只读保留，新评测口径从版本化 scorer/scorecard 一起发布。
  - **范围边界**：任一 case×reviewer 少于 4 对、关键 identity/mapping/evidence/telemetry 缺失时，对应结论为 `inconclusive`；baseline 未实际执行的 reviewer 只能报告 candidate 的独立事实，不能声称相对改善；跨面平均只展示，不抵消单面退步。
  - **依据**：D-012、R-004
  - **场景**：SCN-013
  - **验收**：AC-20

### 宪法、报告和完整场景（GOV/REPORT/SCENARIO）

- **FR-GOV-001**：本需求必须保持四份当前材料、五个正式 stage 和七类 public runtime；不得新增 review lineage、replacement、rebind、continuation、reopen、风险状态机或第五份材料。
  - **依据**：D-002、D-013、D-014
  - **场景**：SCN-001
  - **验收**：AC-21

- **FR-GOV-002**：review/test/evidence/history/complexity 只能记录事实，不能成为继续修复的许可证；unknown、unavailable、incomplete 不能伪装完成。
  - **依据**：D-001、D-013
  - **场景**：SCN-002..004
  - **验收**：AC-22

- **FR-GOV-003**：新增生产对象必须有唯一 owner、真实 consumer、替代关系和删除/保留条件；不建永久兼容桥或第二评分控制面。
  - **依据**：D-011、D-013
  - **场景**：SCN-013
  - **验收**：AC-23

- **FR-REPORT-001**：stage 汇报必须用大白话区分 findings、处置、失败、未完成质量事实、时间/token 和下一阶段边界，不展示虚假的 provider pass。
  - **依据**：R-016、D-001
  - **场景**：SCN-001..004
  - **验收**：AC-24

- **FR-SCENARIO-001**：审查产品行为必须覆盖正常、空、错误、加载、取消、边界、权限和竞态，并给出可观察结果。
  - **依据**：R-018、D-002
  - **场景**：SCN-001..015
  - **验收**：AC-26

## 6. 模块划分

### WorkflowHub 审查语义层

- **负责什么**：定义审查面、材料、finding、处置和复审有效性。
- **对外提供什么**：冻结审查请求与不可变 review 事实。
- **依赖谁**：四份材料、当前实现/测试事实、受信配置、3rd-review。
- **测试边界**：可独立证明材料和语义投影正确、不会自触发复审。

### 3rd-review broker

- **负责什么**：provider/profile 实际调度、隔离、并发、timeout、有限恢复和公共结果。
- **对外提供什么**：每个配置成员的真实终态、usage、timing、error 和 provenance。
- **依赖谁**：受信配置与 provider 能力。
- **测试边界**：可独立证明 N 个 profile 的执行、同源事实和错误分类。

### ModelTest 离线评测

- **负责什么**：固定样本、重复运行、严格评分和 baseline/candidate 比较。
- **对外提供什么**：九面不退步和质量/成本改善事实。
- **依赖谁**：绑定的三仓版本、固定配置、scorecard/evaluator。
- **测试边界**：可独立证明 mutation 命中、clean 误报、失败分母和逐面门槛。

## 7. 关键实体

- **ReviewSurface**：
  - **定义**：一次审查的语义职责，固定为九个已确认 surface 之一。
  - **字段和约束**：stage/review kind、track/scope、问题顺序、required/optional/forbidden 材料、合同版本。
  - **关系**：绑定一个受信 route、一个语义投影和一组 review facts。

- **SemanticProjection**：
  - **定义**：决定旧审查是否仍适用的确定性输入投影。
  - **字段和约束**：surface、投影版本、contract hash、稳定序列化内容、semantic hash；禁止记录型字段。
  - **关系**：review fact 保留它和完整 Git provenance，但不创建 lineage。

- **ReviewerExecution**：
  - **定义**：一个配置 profile 在隔离上下文中的真实执行。
  - **字段和约束**：requested/actual provider/model、context independence、heterologous status、runtime/session、usage、timing、error、原始结果引用。
  - **关系**：多个成员组成一次 review group，但成员事实不可被 aggregate 覆盖。

- **Finding**：
  - **定义**：reviewer 对交付质量的可行动问题。
  - **字段和约束**：severity、lens、anchor、problem、failure mechanism/impact、focused correction、source。
  - **关系**：对应一个人工 disposition；原始 finding 不改写。

- **EvaluationLeg**：
  - **定义**：一个 surface/case/reviewer/version/run 的不可变评测执行。
  - **字段和约束**：固定输入绑定、执行状态、finding、usage/timing、score availability 和失败事实。
  - **关系**：有效 baseline/candidate leg 配对后形成逐面比较。

## 8. 数据和生命周期

- **数据粒度**：review fact 按一次冻结主题；provider execution 按一个配置 profile；evaluation leg 按 surface/case/reviewer/version/run。
- **数据时效**：review 是否当前由当下语义投影纯函数判断；evaluation 只对绑定三仓版本和配置有效。
- **缺失或迟到**：缺失 usage、timing 或 provider 终态写 unavailable/not provided，不估算；迟到结果不得覆盖已记录成员事实。
- **预览与正式**：review findings 是 advice；ModelTest candidate 只有全部逐面门槛可判定后才形成发布评测结论。
- **当前与历史**：review/report/execution 不可变追加；旧事实只读保留，不建立历史运行分支。
- **归属与清理**：各仓保管自己的事实；保留到对应合同/版本被正式替代且迁移完成，之后按独立授权归档，不自动删除。

## 9. 兼容性预留

- **既有消费方**：五阶段、mini-task 和 3rd-review 公共请求/结果消费者继续通过现有入口工作；旧 review/report 保持可读。
- **命名预留**：正式 stage 使用 stage/track，mini-task 使用独立 review kind；二者不得混用。
- **容器预留**：现有 review fact 可增加确定性 projection 身份和执行分类，但不新增并行状态对象。
- **状态预留**：保留 completed_with_findings、completed_no_findings、unavailable、structural_error 及 finding disposition；`running` 只表示 3rd-review 已接管一次请求，WorkflowHub 不自建轮询；current/stale 只作纯函数结果；`record_only_changed` 只解释记录字段不进入语义 hash，不作持久化枚举。`not_requested` 只允许未声明审查面的内部小节点使用；九个正式 surface 不得用它绕过审查，配置或执行失败必须记 unavailable。
- **扩展边界**：未来可增加新 surface 合同版本和 ModelTest fixture 版本；本期不承诺 dashboard、动态 reviewer 路由、跨 provider fallback 或长期兼容桥。

## 10. 明确不做与默认必须成立

### 明确不做

- 不让 wh-review 主要审材料、快照、receipt、流程合规或证据治理（D-001）。
- 不新增 Web UI、dashboard、provider scorecard 页面或 public runtime 命令（D-001、D-011）。
- 不在 WorkflowHub 重写 provider 启动、polling、session、timeout 或 retry 生命周期（D-008）。
- 不新增第五份材料、跨 stage review 状态机、lineage、replacement、rebind、continuation、reopen 或永久兼容桥（D-013）。
- 不用 review 结果阻止同 task 修复，也不用空 findings 宣称 stage 完成（D-001）。
- 不动态改变配置 reviewer 数量，不用未配置模型 fallback（D-003）。
- 不直接复制 AgentHub、Occam Review 或 Matt Pocock 的宿主流程、prompt 或 verdict（D-001）。
- 不把 ModelTest 变成普通 WorkflowHub 运行依赖或第二套日常评分控制面（D-011）。

### 默认必须成立

- 原始 provider、transport、usage、finding、失败和 provenance 不得被摘要覆盖（FR-FINDING-002、FR-EXEC-006）。
- 关键行为、接口、consumer、测试和断言不能因省 token 被删（FR-PACKET-003）。
- 所有严重风险接受都必须来自用户真实确认（FR-FINDING-003）。
- commit、push、merge、archive、cleanup 始终需要独立授权（FR-GOV-002）。

## 11. 验收标准

- [ ] **AC-01**：三个真实任务的全部 attempt 可从只读原始目录回放，task×surface 计数与原始 JSON 一致；未知值保持 unavailable。
  - **需求**：FR-AUDIT-001
  验证：确定性账本重算与抽样回读。
  - **通过条件**：attempt/provider/terminal/token/时长汇总一致，原文件 hash 不变。
  - **失败条件**：漏 attempt、从总量反推未知值或重写历史。
  - **证据类型**：`evidence`

- [ ] **AC-02**：九个 surface 的缺陷样本只由对应问题顺序审查，并能命中各自严重缺陷。
  - **需求**：FR-FOCUS-001..009
  验证：九面 mutation/control 评测。
  - **通过条件**：有 baseline 配对时严重召回不退步，跨面无关 finding 不作为命中；4/5 绝对命中只适用于 AC-20 的 baseline 未执行分支。
  - **失败条件**：漏严重缺陷、主要报告流程治理或用别面 finding 冒充命中。
  - **证据类型**：`test`

- [ ] **AC-03**：每个 surface 只接受自己的 required/optional/forbidden 材料。
  - **需求**：FR-PACKET-001
  验证：逐面正反 packet fixture。
  - **通过条件**：required 缺失明确失败，forbidden 出现明确拒绝，optional 缺失不阻止真实调用。
  - **失败条件**：全仓默认打包、optional 变 gate 或禁止材料进入 provider。
  - **证据类型**：`test`

- [ ] **AC-04**：同一内容不会以不同材料名重复进入 provider packet。
  - **需求**：FR-PACKET-002
  验证：重复内容 fixture 和 manifest 回读。
  - **通过条件**：provider-visible bytes 只有一份，重复项有确定性诊断。
  - **失败条件**：同一 decision/spec 被嵌入两次或 transport 元数据进入语义正文。
  - **证据类型**：`test`

- [ ] **AC-05**：关键材料超限不会被静默截断。
  - **需求**：FR-PACKET-003
  验证：大 diff/consumer/test fixture。
  - **通过条件**：完整可切片时覆盖全部关键语义；仍超限时为 material_too_large/unavailable。
  - **失败条件**：删关键代码或断言后仍写 completed。
  - **证据类型**：`test`

- [ ] **AC-06**：三仓职责没有重复 owner 或隐藏私有依赖。
  - **需求**：FR-OWNER-001
  验证：公共 contract 集成与反向依赖检查。
  - **通过条件**：WorkflowHub 只提交请求，3rd-review 管生命周期，ModelTest 只离线评测。
  - **失败条件**：WorkflowHub 自建 polling/retry controller 或 ModelTest 进入日常运行。
  - **证据类型**：`evidence`

- [ ] **AC-07**：每条保留 finding 都有完整可行动字段和真实锚点。
  - **需求**：FR-FINDING-001
  验证：schema、anchor 和 mutation matcher 检查。
  - **通过条件**：字段齐全且锚点能指向 supplied subject。
  - **失败条件**：空泛建议、无失败机制、无锚点或只报文风。
  - **证据类型**：`test`

- [ ] **AC-08**：空 findings、unavailable 和 stage 完成互不混淆。
  - **需求**：FR-FINDING-002
  验证：三类终态 fixture。
  - **通过条件**：分别保持正常空结果、不可用事实和独立完成判断。
  - **失败条件**：provider failure 变 pass、空 findings 触发重试或直接完成 stage。
  - **证据类型**：`test`

- [ ] **AC-09**：finding 处置保留原文和权限边界。
  - **需求**：FR-FINDING-003
  验证：四种 disposition 和严重风险负例。
  - **通过条件**：普通 finding 有依据；严重风险无用户确认时保持 needs_human。
  - **失败条件**：Host 覆盖 finding 或代替用户接受风险。
  - **证据类型**：`test`

- [ ] **AC-10**：配置 N 个 reviewer 时有 N 个成员事实，并分开统计兑现、独立和异源。
  - **需求**：FR-EXEC-001、FR-EXEC-002
  验证：同 adapter 多 profile 与混合 adapter fixture。
  - **通过条件**：合法请求唯一解析到一个 surface；每个正式 surface 有 route；每个配置 profile 有明确 completed/failed/SAME_SOURCE 事实，调用方无法改列表。
  - **失败条件**：surface 组合含糊、缺 route 却 dispatch/retry/pass/not_requested、静默跳过、动态加减或执行数冒充异源数。
  - **证据类型**：`test`

- [ ] **AC-11**：`SAME_SOURCE` 只由真实上下文身份决定。
  - **需求**：FR-EXEC-003
  验证：同 adapter 隔离进程和真实共享上下文对照。
  - **通过条件**：前者可执行并标独立，后者明确 SAME_SOURCE；route 至少有一个真异源 profile。
  - **失败条件**：仅因 adapter 名相同排除新进程，或无真异源 profile 的 route 仍加载成功。
  - **证据类型**：`test`

- [ ] **AC-12**：每类失败严格遵守唯一恢复 owner 和次数。
  - **需求**：FR-EXEC-004、FR-EXEC-005
  验证：认证、启动、死亡、传输、格式、timeout、超限 fixture。
  - **通过条件**：只有允许类型发生一次对应恢复；每个 profile 有受信正数 deadline，timeout 只结束该成员；WorkflowHub 不叠加 retry。
  - **失败条件**：三次 fresh recovery、跨 provider fallback、timeout 盲重跑或多层相乘。
  - **证据类型**：`test`

- [ ] **AC-13**：部分成功和 aggregate 失败不会重跑或丢失成员事实。
  - **需求**：FR-EXEC-006
  验证：一个成功、一个失败、aggregate 失败 fixture。
  - **通过条件**：成功成员只执行一次，全部 attempt、provider 内部 retry、fresh execution retry、同 session repair、usage/timing/error/provenance 可读，aggregate 明确 incomplete/unavailable；usage 缺失保持 null。
  - **失败条件**：覆盖成员错误、重跑成功 reviewer 或伪造统一成功。
  - **证据类型**：`test`

- [ ] **AC-14**：只写 T010 状态时 semantic hash 不变，真实语义变化时 hash 改变。
  - **需求**：FR-FRESH-001、FR-FRESH-002
  验证：确定性投影正反 fixture。
  - **通过条件**：记录字段变化 hash 相同；行为 diff、需求/决定、AC、接口/schema、迁移、配置、直接 consumer、测试/oracle、phase 范围、计划约束、review contract 任一类变化 hash 不同；contract/version 参与 hash。
  - **失败条件**：完整 tree 或模型摘要决定有效性。
  - **证据类型**：`test`

- [ ] **AC-15**：P5 写回 T010 后直接 aggregate，provider 调用数不增加；真实修复只复审受影响主题一次。
  - **需求**：FR-FRESH-003
  验证：P5/T010 集成计数和真实修复对照。
  - **通过条件**：状态写回 +0 调用；真实修复 +1 受影响调用且结果写回不再触发。
  - **失败条件**：出现“最后一次同快照复核”循环。
  - **证据类型**：`test`

- [ ] **AC-16**：每个 build-code reviewer 一次调用完成三轴，能命中偏需、bug 和无必要复杂度。
  - **需求**：FR-FOCUS-005
  验证：三类 mutation 与调用计数。
  - **通过条件**：同一 packet/调用产生正确 lens finding，调用数不按三轴乘三。
  - **失败条件**：三次调用、漏 correctness 或 necessity 只报风格。
  - **证据类型**：`test`

- [ ] **AC-17**：mini-task 两条 route 独立存在并替代同范围普通审查。
  - **需求**：FR-MINI-001、FR-MINI-002
  验证：design/implementation route 和普通 review 计数。
  - **通过条件**：真实配置各有一次专用审查，无第六 stage、无重复普通审查；缺 route 时 0 provider 调用、1 次 configuration unavailable。
  - **失败条件**：route 缺失却 retry/fallback/passed、或专用+普通双审。
  - **证据类型**：`test`

- [ ] **AC-18**：mini-task 不能自报 pass，实施审查绑定完整用户结果和边界。
  - **需求**：FR-MINI-003、FR-MINI-004
  验证：caller status、极简伪 review、缺 test/AC/user-result oracle、重复 test、越界 mutation。
  - **通过条件**：调用方 status 被拒绝；完整 canonical result 才能 recorded；证据只采集一次；每个适用 AC 和用户结果字段可回读；越界和假绿被 finding 命中。
  - **失败条件**：缺省 `passed`、审查后无条件重跑 test、只看 diff 不看用户结果或无限 fresh review。
  - **证据类型**：`test`

- [ ] **AC-19**：九面前后评测完整、可配对且失败不从分母消失。
  - **需求**：FR-EVAL-001..003
  验证：固定 bundle 的 540 leg/reviewer 计划、盲名/交错顺序与执行读回。
  - **通过条件**：每面 6 cases×2 versions×5 runs×配置 reviewer；A/B 中性盲名并交错；一个 case 一次交易；每个计划 leg 有 attempt；严格 matcher；失败、usage、timing 全部保留。
  - **失败条件**：少跑 reviewer/case/run、失败样本删除或别的 finding 算命中。
  - **证据类型**：`evidence`

- [ ] **AC-20**：每个 candidate surface 都有可回读的质量、稳定性、成本和证据完整性对照事实；不把固定分数当成继续或交付闸门。
  - **需求**：FR-EVAL-004
  验证：逐面版本化 scorecard/evaluator 比较。
  - **通过条件**：逐面有真实的质量、稳定性、成本和证据完整性事实；有配对时能读出严重召回、误报、执行率、token、时长和 finding 质量的变化；不可计算的部分明确写成 `inconclusive/unavailable`。评测结果只用于决定下一步修复和发布风险，不作为 WorkflowHub 继续、阶段完成或正式 close 的单一许可证。
  - **失败条件**：把 provider 失败、配对不足、telemetry 缺失或无 finding 写成通过；用跨面平均数掩盖单面退步；或因差一个固定分数就丢失真实质量和成本事实。
  - **证据类型**：`evidence`

- [ ] **AC-21**：交付没有新增第五材料、第六 stage、公共命令或 review 状态机。
  - **需求**：FR-GOV-001
  验证：宪法清单与公开接口枚举。
  - **通过条件**：现有四材料、五 stage、七 public runtime 保持。
  - **失败条件**：新增 lineage/rebind/reopen/continuation 或第二完成记录。
  - **证据类型**：`evidence`

- [ ] **AC-22**：质量事实不会阻止同 task 修复，也不会被写成完成。
  - **需求**：FR-GOV-002
  验证：unknown/unavailable/incomplete 场景。
  - **通过条件**：Agent 可继续安全修复，报告保持真实 incomplete。
  - **失败条件**：质量事实成为推进许可证或假绿。
  - **证据类型**：`test`

- [ ] **AC-23**：每个新增对象有唯一 owner、consumer、替代关系和保留条件。
  - **需求**：FR-GOV-003
  验证：生产对象 inventory 和反向 consumer 检查。
  - **通过条件**：无孤儿 schema、双写、永久桥或第二评分权威。
  - **失败条件**：无 consumer 对象进入生产或旧新控制面长期并存。
  - **证据类型**：`evidence`

- [ ] **AC-24**：用户汇报用大白话分开 findings、失败、成本和下一步。
  - **需求**：FR-REPORT-001
  验证：九面成功/空/失败报告样本。
  - **通过条件**：不显示 provider pass；unavailable 和未完成风险可见。
  - **失败条件**：用技术状态掩盖结果或把失败写成通过。
  - **证据类型**：`manual`

- [ ] **AC-25**：所有 FR/AC 可回到 R/D/SCN/PFACT，且无未授权行为。
  - **需求**：FR-TRACE-001
  验证：确定性 source/FR/AC 覆盖检查。
  - **通过条件**：双向映射完整，DEFER/OPEN 有 owner/trigger/consumer/close。
  - **失败条件**：孤儿 FR/AC、静默补方向或延期无交接。
  - **证据类型**：`evidence`

- [ ] **AC-26**：正常、空、错误、加载、取消、边界、权限和竞态都有可观察 oracle。
  - **需求**：FR-SCENARIO-001
  验证：场景覆盖检查与对应测试设计。
  - **通过条件**：八类状态均绑定 SCN 和 AC，无适用状态被遗漏。
  - **失败条件**：只测成功路径或以 N/A 隐藏适用状态。
  - **证据类型**：`evidence`

- [ ] **AC-27**：verify-code 缺少任一正式事实时，阶段和 close 都保持 incomplete。
  - **需求**：FR-CLOSE-001
  验证：分别删除测试、独立审查、finding 处置、AC、例外和人工确认事实。
  - **通过条件**：六项逐条显示缺失；`recorded` 的 review 可以继续工作，但不能替代其他事实。
  - **失败条件**：只因测试和 review 存在就能准备 close。
  - **证据类型**：`test`

- [ ] **AC-28**：close 逐条验证正式事实的状态、类型、hash 和当前绑定。
  - **需求**：FR-CLOSE-002
  验证：failed、unavailable、旧快照、错误 evidence、`needs_human` 和拒绝确认。
  - **通过条件**：任何一项不合格都给出具体缺口；全部合格才进入 close plan。
  - **失败条件**：缺失事实被当成历史事实或 provider 空 findings。
  - **证据类型**：`test`

- [ ] **AC-29**：材料只写回记录字段时，测试 receipt 和 semantic review result 复用，provider 调用数为 0；代码或真实语义变化时旧事实不能复用。
  - **需求**：FR-CLOSE-003、FR-FRESH-003
  验证：无变化、材料只变、代码只变、代码+材料变化四象限。
  - **通过条件**：source digest 和语义 hash 规则正确，当前质量事实重新绑定后可 close。
  - **失败条件**：材料写回强制重复 provider，或代码变化错误复用旧事实。
  - **证据类型**：`test`

- [ ] **AC-30**：verify 人工确认与 close confirmation、commit/merge/push/archive/cleanup 授权保持独立。
  - **需求**：FR-CLOSE-004
  验证：缺 verify 确认、缺 close 确认、缺不可逆授权的组合。
  - **通过条件**：每个动作只由自己的事实/授权支持。
  - **失败条件**：close confirmation 代替 verify 确认，或 review 代替 Git 操作授权。
  - **证据类型**：`test`

- [ ] **AC-31**：普通和严重 canonical finding 都必须有 disposition；不能只过滤 serious finding。
  - **需求**：FR-FINDING-004
  验证：同一 review 同时包含 minor 和 serious finding，分别测试缺普通处置、缺严重处置和全部处置。
  - **通过条件**：两类 finding 都保留原始字段并逐条记录；只有 serious finding 触发额外完成/风险暂停。
  - **失败条件**：minor finding 被静默丢弃，或 provider verdict 代替 finding 处置。
  - **证据类型**：`test`

- [ ] **AC-32**：`accepted_risk` 没有精确绑定的用户风险确认时不能完成；mini-task design/implementation 同样失败并保留 incomplete。
  - **需求**：FR-FINDING-004
  验证：无确认、错 finding、错 review/hash、错 snapshot 和完整确认五种情况。
  - **通过条件**：只有真实确认覆盖当前 finding 才能记录为可完成事实。
  - **失败条件**：只要 status=`accepted_risk` 就通过，或自动生成用户确认。
  - **证据类型**：`test`

## 12. 风险、未决与交接

- **RISK-01**：材料裁剪过度导致严重问题漏报。
  - **受影响 ID**：FR-PACKET-001..003、AC-03..05
  - **触发条件**：为省 token 删除行为 diff、consumer、测试或断言。
  - **后果**：review 成本下降但质量虚假提高。
  - **缓解或 STOP**：关键语义无法完整交付时停止并记录 material_too_large。
  - **处理 Stage**：`build-spec`
  - **验证**：大材料正反 fixture 与 ModelTest 严重 mutation。

- **RISK-02**：semantic hash 漏掉真实语义字段或重新变成完整 snapshot。
  - **受影响 ID**：FR-FRESH-001..003、AC-14..15
  - **触发条件**：投影未版本化、字段 allowlist 不完整或使用模型摘要。
  - **后果**：错误复用旧审查或重现 P5/T010 循环。
  - **缓解或 STOP**：每类包含/排除字段必须有正反 fixture；无法证明则停止发布。
  - **处理 Stage**：`build-plan`
  - **验证**：确定性投影测试和调用计数。

- **RISK-03**：三仓版本错配使评测无法复现。
  - **受影响 ID**：FR-OWNER-001、FR-EVAL-001..004、AC-06、AC-19..20
  - **触发条件**：manifest 未绑定三仓身份、配置或 evaluator。
  - **后果**：提升结论不可信。
  - **缓解或 STOP**：任一身份不可回读时 comparison 为 inconclusive。
  - **处理 Stage**：`build-plan`
  - **验证**：版本绑定读回与混合版本负例。

- **RISK-04**：ModelTest 当前评分或 matcher 缺口产生假提升。
  - **受影响 ID**：PFACT-07、FR-EVAL-001..004、AC-19..20
  - **触发条件**：mutation 漏检仍 ready、失败出分母或 score 不可计算。
  - **后果**：低质量 candidate 被发布。
  - **缓解或 STOP**：严格 matcher、失败完整性和绝对底线任一不可用即 inconclusive。
  - **处理 Stage**：`build-spec`
  - **验证**：漏检、错锚点、失败 leg 和 not_computable 负例。

- **RISK-05**：真实评测调用量和成本很高。
  - **受影响 ID**：FR-EVAL-001..004、AC-19..20
  - **触发条件**：九面、配置 reviewer 和 5 次重复全部运行。
  - **后果**：评测本身延长交付。
  - **缓解或 STOP**：运行前报告预计调用/token/时间/成本；只在本功能发布前运行，不进入普通任务。
  - **处理 Stage**：`build-plan`
  - **验证**：计划调用数与实际 leg 数一致。

- **OPEN-01（已关闭）**：三仓当前 public schema、scorecard、mini-task 和兼容细节已由四路只读条件研究核实。
  - **关闭事实**：PFACT-07、PFACT-09..11 已升级为 verified；差距已进入 FR-EXEC、FR-MINI、FR-EVAL 和 AC-10..20。
  - **关闭时间/owner**：build-spec，2026-08-13。

- **DEFER-002**：接口/schema 字段语义和测试步骤细化。
  - **受影响 ID**：FR-PACKET-001、FR-FINDING-001、FR-EXEC-002、FR-EVAL-001
  - **owner**：build-spec（产品字段语义）、build-plan（测试步骤）
  - **影响**：不改变已确认产品方向。
  - **处理 Stage**：`build-spec` / `build-plan`
  - **关闭条件或 STOP**：产品边界字段进入本 spec；工程命令和任务步骤进入 plan/tasks。

- **DEFER-003**：三仓代码修改、迁移和真实评测执行。
  - **受影响 ID**：全部 FR/AC
  - **owner**：build-code、verify-code
  - **影响**：本 spec 通过不等于功能已实现或效果已证明。
  - **处理 Stage**：`build-code` / `verify-code`
  - **关闭条件或 STOP**：三仓实现、测试、review、九面比较和版本读回事实完成。

## 13. 业务影响与回归范围

### 五阶段与 mini-task 审查

- **既有行为**：每个 stage 通过 wh-review 获取 findings，但材料、恢复、同源和复审行为存在已知浪费与假绿风险。
- **本需求影响**：每面只审自己的交付风险，mini-task 使用两条专用 route，状态写回不重复审查。
- **回归路径**：make-decision direction/detail、build-spec、build-plan、code phase/integration、verify、mini design/implementation 的成功、空、失败和复审路径。
- **验收**：AC-02..18、AC-21..26

### 3rd-review 调度

- **既有行为**：公共 broker 返回成员结果，但当前配置兑现、同 adapter 和多层恢复语义与目标不一致。
- **本需求影响**：每个配置 profile 有独立事实，恢复 owner 唯一，成功成员不重跑。
- **回归路径**：多 profile、同 adapter、认证、启动、死亡、传输、格式、timeout、partial aggregate。
- **验收**：AC-06、AC-10..13

### ModelTest 发布评测

- **既有行为**：已有固定资产和版本化评分，但九面、重复运行、严格 matcher 和失败完整性不足。
- **本需求影响**：形成逐面 baseline/candidate 发布评测，不把失败或平均数藏起来。
- **回归路径**：mutation、clean control、执行失败、not_computable、混合版本、少于 4 对和全部门槛。
- **验收**：AC-19..20、AC-23

## 14. build-spec 执行结论

- **条件研究**：已完成 WorkflowHub、3rd-review、ModelTest、mini-task 四路独立只读核实；当前 commit、公开边界、失败行为和现有测试结果已写入 PFACT-07、PFACT-09..11。
- **需求澄清**：无需再次询问。严重度映射、评分聚合、clean 误报、配对粒度、timeout owner 和兼容协议均是已确认方向内的规格细化，没有新增产品方向。
- **简化检查**：只新增必要的语义投影、新版 3rd-review result protocol 和新版 ModelTest benchmark 资产；不新增 stage、公开 WorkflowHub 命令、第五材料、review 状态机或日常评分控制面。
- **CEO 检查**：核心用户收益是更容易发现真正影响交付的问题，同时减少重复 provider 调用、重复测试和无效材料；所有范围内行为都能回到 R-001..R-023。
- **设计检查**：`not_applicable`。本需求不包含 Web、移动端页面、视觉稿或 dashboard；用户可见结果沿用 CLI 和报告。

### build-spec review finding 处置

| Finding | 处置 | 结果 |
| --- | --- | --- |
| F-2e364d0f8d47 | fixed | A/B 中性盲名与交错运行进入 FR-EVAL-001、AC-19 |
| F-491bcbd19642 | fixed | 九面 route 缺失和 not_requested 防绕过进入 FR-EXEC-002、状态与 AC-10 |
| F-719612dc5dd6 | fixed | 真异源 profile 加载校验进入 FR-EXEC-003、AC-11 |
| F-87afc5e4facc | fixed | 恢复配对分支与 baseline 未执行分支的原始阈值 |
| F-9bd630f26720 | fixed + rejected_invalid | 已补 scorecard/evaluator 版本与 70/30 公式绑定；不采纳 PFACT 降级，因为四路条件研究已真实完成，只是当前 review packet 合同不提供跨仓证据，现已显式标为 packet unavailable |
| F-069cd8712531 | fixed | retry 字段改成 provider 内部、fresh execution、同 session repair 三类明确计数 |
| F-5153d4154693 | fixed | semantic hash 补回 schema、迁移、计划约束和行为 diff |
| F-98182d4a13f0 | fixed | 删除未获需求授权的 doctor 展示要求 |
| F-e3f5be26bd69 | fixed | 两个改善分支共同要求 quality 不降、token/时长各自恶化不超过 10% |
| F-f0afa9c3e8bc | fixed | 补回 running 和 record_only_changed 的准确语义 |

复核 attempt `3373dbc4-9584-4f7a-a0db-5b730fd2cea1` 是严重 finding 修复后的唯一 provider 复核。以上新 finding 已按批准决定直接修复；不再为了取得空 findings 启动第三次同材料审查，最终一致性由只读 `spec-analyze` 检查。

- **可能受冲击的业务规则**：现有五阶段顺序、四材料职责、review advice-only、provider 公共接口、旧报告可读性。
- **明确无影响**：Web UI、普通业务页面、非审查型 WorkflowHub 功能、历史 review/report 字节、未经授权的 Git/close 操作。
