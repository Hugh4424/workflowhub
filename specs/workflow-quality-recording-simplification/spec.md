# 功能规格：核心质量流程真实执行与轻量记录

> 基于已接受的 make-decision 方向。本文件只定义 WorkflowHub 的可观察行为、边界与验收，不把审计完整性变成推进许可证。

- **功能名**：核心质量流程真实执行与轻量记录
- **来源**：accepted make-decision；D-01 至 D-12；用户要求将处理组 3 与五项质量流程问题纳入同一任务
- **状态**：草稿

## 速读卡（30 秒）

- **一句话需求**：WorkflowHub 必须真实执行五阶段声明的质量动作、如实显示缺口，同时允许同一任务持续修复。
- **核心改动点**：
  - 用 runtime-owned invocation fact 证明真实调用，并统一核对阶段完成。
  - 保留首次审查与历史材料，修复后只做聚焦验证，不把 audit/review 变成 Gate。
  - 浏览器 QA 与 verify-code 输出可定位、可判真的统一证据。
- **最大影响面**：五阶段完成声明、审查生命周期、四材料更新、浏览器验收和最终验证。
- **验收信号**：伪造调用不能完成阶段；核心交付、测试和逐 AC 决定业务结论；记录缺失只如实披露。

## 1. 问题与紧迫性

WorkflowHub 已声明 talk、grill、review、浏览器 QA 和 verify 等质量动作，但旧流程可能只靠 payload、receipt 或 journal 就把步骤写成完成，无法证明组件真的执行过。为了堵住遗漏而继续增加认证、Gate 和重复审查，又会让漏一条记录就卡死整个任务。

本需求要同时解决两件事：质量动作必须真实、可核对、缺失时不假绿；流程仍要允许正常修复和材料演进，审计支持不得取代代码、测试和逐 AC 的业务判断。

## 2. 背景、目标与范围

### 背景

已接受方向要求五阶段共享同一套调用真实性与完成核对语义，并保持三个谓词分离：是否可继续工作、正式写入是否真实、是否可以宣称完成。首次审查、旧材料版本和错误 run 都必须保留，不得为了得到新 pass 而覆盖历史。

### 目标

- 五阶段声明的 direct Skill 只有真实 dispatch 后才算 executed。
- 阶段结束时能统一说明 complete、incomplete 或 unknown，以及缺失和 unavailable 项。
- 修复审查问题、更新四材料和补齐证据时，不自动触发 full review、reopen 或 reset。
- verify-code 对实际交付、风险测试、逐 AC、tasks、审查和适用 UI 证据做完整核对。
- 浏览器 QA 能回答测了什么、如何测、登录态、性能、证据位置和 cleanup。
- 错误历史保留，同一任务可从正式入口透明恢复。

### 范围内

- 五阶段声明组件的真实调用事实与统一完成核对。
- review replay、aggregation、finding resolution 与聚焦验证。
- 四材料的 append-only revision 和同任务 requirements ledger 演进。
- 浏览器 QA 证据合同。
- verify-code 的分项业务核对与非 Gate 审计披露。
- 错误 run 的同任务透明恢复。

## 3. 用户场景与状态覆盖

### SCN-001：真实执行 make-decision 质量动作

- **角色**：执行 WorkflowHub 任务的用户
- **Given**：make-decision 声明 talk、grill 和 review 组件
- **When**：阶段尝试完成这些步骤
- **Then**：只有经过真实 dispatch 的 runtime-owned invocation fact 才能证明组件已执行；手写 payload 不能完成步骤

### SCN-002：阶段结束时核对声明组件

- **角色**：阶段执行者和下游接手者
- **Given**：阶段具有 always 与 conditional 组件
- **When**：阶段生成完成摘要
- **Then**：逐项显示 executed、trigger=false、missing 或 unavailable；缺失时阶段为 incomplete，但允许同任务补做

### SCN-003：修复首次审查发现的问题

- **角色**：修复审查 finding 的开发者
- **Given**：首次 canonical verdict 为 `revise_required`
- **When**：代码或材料已经修复并完成针对性验证
- **Then**：保留旧结果，追加 finding disposition、resolution 和 focused verification，不要求新 pass

### SCN-004：同任务更新四材料

- **角色**：维护 decision-log、spec、plan 和 tasks 的任务执行者
- **Given**：四材料已经存在历史 revision、hash 或 accepted 记录
- **When**：当前需求或证据需要正常补充
- **Then**：追加当前 revision 与来源映射，旧版本只读保留，不触发 reopen、reset 或 full review

### SCN-005：完整执行 verify-code

- **角色**：独立验证者
- **Given**：当前四材料和候选交付可读
- **When**：验证最终代码
- **Then**：逐项核对实际 diff、风险测试、每个 AC、tasks、独立 review、适用 UI 证据、缺口和交接；audit 缺失只披露

### SCN-006：形成可核对的浏览器 QA 证据

- **角色**：执行 UI 验收的测试者
- **Given**：至少一个 AC 需要浏览器交互验证
- **When**：测试页面、路由或完整流程
- **Then**：证据记录页面、场景、工具、登录态、性能状态、截图、测试文件、结果和 cleanup，且不泄露凭据

### SCN-007：稳定 replay 与 review aggregation

- **角色**：复用已有审查事实的 review controller
- **Given**：同一 subject 已有 canonical review 结果
- **When**：材料补齐、普通修复或 replay/aggregation 发生
- **Then**：保留 anchor/profile，以稳定 finding identity 精确匹配；普通材料变化不重复 provider 调用

### SCN-008：同任务恢复错误 run

- **角色**：发现旧阶段漏调组件的任务所有者
- **Given**：旧 make-decision run 已经写入但实际漏掉声明组件
- **When**：通用编排修复后从正式入口重跑
- **Then**：旧 run 仍为 incomplete，新 run 引用其为 recovery source 并产生真实 invocation facts

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-002
- [x] **空态**：SCN-002 — 无 invocation fact 时显示 missing，不推断 executed
- [x] **错误态**：SCN-003、SCN-007、SCN-008
- [x] **加载态**：SCN-006 — 浏览器加载和性能状态由统一证据记录
- [x] **取消态**：SCN-002 — conditional 不执行时必须记录 `trigger=false + reason`
- [x] **边界态**：SCN-004、SCN-007
- [x] **权限态**：SCN-001 — caller 不能写入 runtime-owned invocation fact
- [x] **竞态**：SCN-007 — 同 subject 并发或顺序重复 initial 最多一次 provider dispatch

## 4. 产品事实与假设（PFACT）

- **PFACT-01**：声明、内容证据、receipt、journal 或宿主文字都不能证明 Skill 已真实调用
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-01、D-02
  - **关联**：FR-INV-001 至 FR-INV-005、FR-COMP-001 至 FR-COMP-005；AC-01、AC-02、AC-03

- **PFACT-02**：可继续工作、正式写入真实、可宣称完成是三个独立判断
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-03、D-04
  - **关联**：FR-COMP-001 至 FR-COMP-005、FR-VER-001 至 FR-VER-003；AC-03、AC-04、AC-13、AC-14

- **PFACT-03**：首次 canonical review verdict 必须永久保留，普通修复不应自动 full review
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-05、D-10
  - **关联**：FR-REV-001 至 FR-REV-006；AC-05 至 AC-08

- **PFACT-04**：四材料是同一任务的当前材料，历史版本不授予也不撤销开发许可
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-06、D-11、D-12
  - **关联**：FR-MAT-001 至 FR-MAT-007；AC-09、AC-10、AC-17、AC-18

- **PFACT-05**：仅写“页面测试通过”不足以证明浏览器 QA 真实完成
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-07
  - **关联**：FR-BQA-001 至 FR-BQA-003；AC-11、AC-12

- **PFACT-06**：verify-code 的业务结论必须由核心交付、测试和逐 AC 支撑
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-08
  - **关联**：FR-VER-001 至 FR-VER-003；AC-13、AC-14

- **PFACT-07**：review replay 必须稳定绑定 evidence anchor、requested profiles 和 finding identity
  - **status**：`verified`
  - **证据或来源**：accepted make-decision D-09
  - **关联**：FR-REV-004 至 FR-REV-006；AC-06、AC-07、AC-08

- **PFACT-08**：本机 build-code provider priority 配置是否会阻断后续独立审查尚未核实
  - **status**：`unknown`
  - **owner、影响**：宿主配置所有者；若实际阻断 T013 的独立审查，影响 FR-REV-003 和 AC-14；关联 RISK-01、OPEN-01
  - **关联**：FR-REV-003、FR-VER-003；AC-14

- **PFACT-09**：旧错误 run 必须保留，修复后的新 run 不得继承伪 invocation facts
  - **status**：`verified`
  - **证据或来源**：accepted make-decision 的同任务透明恢复方向
  - **关联**：FR-REC-001、FR-REC-002；AC-15、AC-16

## 5. 功能需求

### 调用真实性（INV）

五阶段共享统一的声明组件调用语义。内容证据和步骤观察可用于核对结果，但不能替代真实 dispatch。

- **FR-INV-001**：统一 dispatch owner 消费五阶段 `skill-deps.yaml`
  - **范围边界**：`always` 必须调用；`conditional` 必须记录 executed 或 `trigger=false + reason`
  - **依据**：PFACT-01；D-01
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-01、AC-03、AC-16

- **FR-INV-002**：每次真实 `hostInvoke` 由 runtime 追加 invocation fact
  - **范围边界**：至少绑定 task、stage、run、skill、invocation key、声明 trigger、bundle hash、outcome ref/hash 和 snapshot；caller 不得写入或伪造
  - **依据**：PFACT-01；D-01
  - **场景**：SCN-001
  - **验收**：AC-02、AC-15

- **FR-INV-003**：content evidence、receipt、journal 和 step exit 只能证明内容或观察
  - **范围边界**：这些事实不能授予 invoked 或 executed
  - **依据**：PFACT-01；D-01
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-01、AC-02

- **FR-INV-004**：组件 unavailable 必须如实记录
  - **范围边界**：不能伪装 pass；宿主不支持调用时阶段保持 incomplete/unknown，但同任务修复可继续
  - **依据**：PFACT-01、PFACT-02；D-01、D-03
  - **场景**：SCN-002、SCN-008
  - **验收**：AC-03、AC-14、AC-15

- **FR-INV-005**：reviewer-owned lens 只由 `wh-review` 的正式结果证明
  - **范围边界**：不得作为 direct component 再次 dispatch
  - **依据**：PFACT-01、PFACT-03；D-01、D-05
  - **场景**：SCN-002、SCN-007
  - **验收**：AC-01、AC-06

### 完成核对与非 Gate（COMP）

业务完成由核心交付、测试和逐 AC 决定；阶段记录完整性由 invocation、review、handoff 与结构绑定决定。记录不完整必须披露，但 review/audit 缺失不得成为 build-code 或 verify-code 的进入 Gate。

- **FR-COMP-001**：统一 completion reconciler 对照声明步骤、依赖组件、invocation facts 和 business facts
  - **范围边界**：不得只依赖 journal、receipt 或单一状态字段
  - **依据**：PFACT-01、PFACT-02；D-02、D-03
  - **场景**：SCN-002、SCN-005
  - **验收**：AC-01、AC-03、AC-13

- **FR-COMP-002**：reconcile 只决定能否宣称阶段完整
  - **范围边界**：不得作为 build-code 或 verify-code 的进入许可证
  - **依据**：PFACT-02；D-03
  - **场景**：SCN-002、SCN-005
  - **验收**：AC-03、AC-04、AC-14

- **FR-COMP-003**：summary 分开输出质量和记录状态
  - **范围边界**：包含 complete/incomplete/unknown、missing/unavailable components、代码/测试/AC/review 状态和 audit gaps
  - **依据**：PFACT-02；D-02、D-03
  - **场景**：SCN-002、SCN-005
  - **验收**：AC-03、AC-04、AC-13、AC-14

- **FR-COMP-004**：身份错绑或核心 publication 结构错误在写边界 fail-loud
  - **范围边界**：task、worktree、runtime 身份或核心结构错绑必须拒绝；audit/support 缺失只记录
  - **依据**：PFACT-02；D-03、D-04
  - **场景**：SCN-002、SCN-005
  - **验收**：AC-04

- **FR-COMP-005**：手工步骤记录保留为 observation/debug
  - **范围边界**：不得授予真实 invocation 或 complete
  - **依据**：PFACT-01、PFACT-02；D-01、D-02
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-01、AC-02

### Review 生命周期（REV）

一次正式审查给出质量事实；修复后的聚焦验证说明 finding 如何处理，不制造新的历史真相。

- **FR-REV-001**：首次 canonical verdict 永久保留
  - **范围边界**：修复后追加 finding disposition、变更 hash、受影响测试和 AC 结果，不覆盖原字节
  - **依据**：PFACT-03；D-05
  - **场景**：SCN-003
  - **验收**：AC-05

- **FR-REV-002**：普通修复和材料补齐只做 focused verification
  - **范围边界**：代码修复、文案、context map 和 tasks 证据补齐不得自动 full review，也不得要求新 pass
  - **依据**：PFACT-03；D-05、D-10
  - **场景**：SCN-003、SCN-007
  - **验收**：AC-05、AC-06

- **FR-REV-003**：每个阶段或候选的首次声明 review 必须真实执行或如实 unavailable
  - **范围边界**：已有 canonical verdict 后，额外语义 review 只由用户明确要求触发；新 action 保留父/root lineage
  - **依据**：PFACT-03、PFACT-08；D-05
  - **场景**：SCN-003、SCN-005、SCN-007
  - **验收**：AC-05、AC-14

- **FR-REV-004**：controller 从 canonical head 查找同 subject 既有结果
  - **范围边界**：caller ref 与 head 冲突 fail-loud；同 subject 第二次 initial/full 不调用 provider
  - **依据**：PFACT-03、PFACT-07；D-05、D-10
  - **场景**：SCN-007
  - **验收**：AC-06

- **FR-REV-005**：provider 调用前检查 snapshot、subject、required maps 和 anchor
  - **范围边界**：材料不完整写 `MATERIAL_INCOMPLETE`，`provider_calls=0`
  - **依据**：PFACT-03、PFACT-07；D-10
  - **场景**：SCN-007
  - **验收**：AC-07

- **FR-REV-006**：replay 使用持久化 `requested_profiles` 与 `evidence_anchor_valid`
  - **范围边界**：新记录按 finding identity 精确匹配，缺失或错配报 `REPLAY_MISMATCH`；legacy fuzzy 仅诊断，不影响 verdict
  - **依据**：PFACT-07；D-09
  - **场景**：SCN-007
  - **验收**：AC-08

### 四材料更新（MAT）

四材料在同一任务内持续演进。revision 是版本事实，不是 reopen、reset、checkpoint 或审查许可证。

- **FR-MAT-001**：四材料更新只追加轻量 revision
  - **范围边界**：记录 revision id、previous revision、changed files、change summary、source refs 和 content hashes
  - **依据**：PFACT-04；D-06
  - **场景**：SCN-004
  - **验收**：AC-09

- **FR-MAT-002**：revision 不要求额外推进手续
  - **范围边界**：不要求 reopen、reset、rebind、checkpoint 或 accepted；build-code 和 verify-code 只检查当前四文件可读
  - **依据**：PFACT-04；D-06
  - **场景**：SCN-004、SCN-005
  - **验收**：AC-09

- **FR-MAT-003**：影响需求结构的修改同步更新来源映射
  - **范围边界**：影响 SCN、FR、AC、范围或依赖时更新映射；普通说明或证据只更新实际涉及文件
  - **依据**：PFACT-04；D-06
  - **场景**：SCN-004
  - **验收**：AC-09、AC-10

- **FR-MAT-004**：旧 revisions 和 hashes 只读保留
  - **范围边界**：旧 hash 不阻断开发，也不触发自动 full review
  - **依据**：PFACT-03、PFACT-04；D-05、D-06
  - **场景**：SCN-003、SCN-004
  - **验收**：AC-05、AC-09

- **FR-MAT-005**：requirements ledger 支持同 task append-only revision 和 supersede
  - **范围边界**：intake 范围补充不得强制创建新 TaskHandle
  - **依据**：PFACT-04；D-06
  - **场景**：SCN-004
  - **验收**：AC-10

- **FR-MAT-006**：detail review 后树变化只追加一次聚焦 Grill revalidation
  - **范围边界**：绑定原 Grill、当前 material revision 和新树；不重跑 Talk 或 full review，不覆盖原 review verdict
  - **依据**：PFACT-04；D-11
  - **场景**：SCN-003、SCN-004、SCN-007
  - **验收**：AC-17

- **FR-MAT-007**：structural resolution 不自动创建 review-flow reset
  - **范围边界**：若修复 revalidation/runtime 本身导致树再变化，只允许一个 `0002` 显式 supersede 已完成的 `0001`；`0002` 绑定直接下一版 material revision 和独立 authenticated invocation；禁止 `0003`
  - **依据**：PFACT-04；D-12
  - **场景**：SCN-003、SCN-004、SCN-007
  - **验收**：AC-18

### 浏览器证据（BQA）

浏览器证据只裁决适用 UI AC，不扩展为所有任务的认证要求。

- **FR-BQA-001**：UI acceptance 触发浏览器 QA 时使用统一证据
  - **范围边界**：记录页面或 route、场景或 AC、工具或引擎、登录态 `reused|fresh|none`、性能指标或 `not_measured|not_applicable + reason`、截图 refs、测试文件、实际命令、结果、exit 和 cleanup；测试文件不适用时仍须记录实际命令与不适用原因
  - **依据**：PFACT-05；D-07
  - **场景**：SCN-006
  - **验收**：AC-11、AC-12

- **FR-BQA-002**：浏览器证据绑定当前代码 snapshot 与测试时间
  - **范围边界**：截图和测试文件必须可定位；登录态只记录是否复用，不泄露凭据
  - **依据**：PFACT-05；D-07
  - **场景**：SCN-006
  - **验收**：AC-11

- **FR-BQA-003**：仅适用 UI AC 需要 browser evidence
  - **范围边界**：非 UI 任务记录 not_applicable，不形成全局 Gate
  - **依据**：PFACT-02、PFACT-05；D-03、D-07
  - **场景**：SCN-005、SCN-006
  - **验收**：AC-12、AC-14

### 最终验证（VER）

verify-code 展示完整事实，但审计记录是否齐全不替代业务完成判断。

- **FR-VER-001**：verify-code 显式拆分验证视图
  - **范围边界**：包含当前四材料、实际 diff 或交付范围、风险测试、逐 AC、tasks、适用浏览器证据、独立 review/resolution、缺口、交接和验证结果
  - **依据**：PFACT-02、PFACT-06；D-08
  - **场景**：SCN-005
  - **验收**：AC-13、AC-14

- **FR-VER-002**：每个验证项输出可判定状态
  - **范围边界**：使用 pass、fail、unknown 或 not_applicable，并附 evidence 或 reason；缺核心交付、测试或 AC 时不得宣称通过，audit 缺失不改变业务结论
  - **依据**：PFACT-02、PFACT-06；D-03、D-08
  - **场景**：SCN-005
  - **验收**：AC-13、AC-14

- **FR-VER-003**：verify review 是独立质量事实
  - **范围边界**：不是进入 Gate；unavailable 如实披露；人类 verify 确认和 close 授权保持分离
  - **依据**：PFACT-02、PFACT-06、PFACT-08；D-04、D-08
  - **场景**：SCN-005
  - **验收**：AC-14

### 同任务透明恢复（REC）

错误历史不删除、不改写、不倒填；恢复只通过新的正式 run 表达。

- **FR-REC-001**：错误 run 保留并标记 incomplete
  - **范围边界**：必须列明缺失的真实 invocations
  - **依据**：PFACT-09；同任务透明恢复方向
  - **场景**：SCN-008
  - **验收**：AC-15

- **FR-REC-002**：修复后同一 task 从正式入口重跑
  - **范围边界**：新 run 引用旧 run 为 recovery source，但不继承伪 invocation facts
  - **依据**：PFACT-09；同任务透明恢复方向
  - **场景**：SCN-008
  - **验收**：AC-15、AC-16

## 6. 模块划分

### 阶段调用路由

- **负责什么**：读取阶段声明并触发 direct Skill，形成不可由 caller 自报的真实调用事实
- **对外提供什么**：组件 executed、trigger=false、missing 或 unavailable 的可核对状态
- **依赖谁**：阶段声明、宿主调用能力和当前任务身份
- **测试边界**：伪 payload 不授予执行状态，真实调用只产生一次事实

### 完成核对

- **负责什么**：把声明步骤、声明组件、调用事实和业务事实汇总为阶段完成视图
- **对外提供什么**：complete、incomplete 或 unknown，以及质量状态和审计缺口
- **依赖谁**：阶段调用路由、业务交付事实、review 与 handoff 事实
- **测试边界**：记录缺失会披露但不成为开发许可证；正式错绑 fail-loud

### Review 生命周期

- **负责什么**：保留首次 verdict、控制同 subject 调用次数、记录 resolution 与 focused verification
- **对外提供什么**：canonical review head、finding disposition、replay 或 mismatch 结果
- **依赖谁**：冻结的 subject、anchor、profiles、snapshot 和正式 provider 结果
- **测试边界**：普通修复零重复 provider 调用，错配 replay 不改变 verdict

### 当前材料与恢复

- **负责什么**：维护四材料 revision、requirements ledger 演进和错误 run 的 append-only 恢复
- **对外提供什么**：当前材料事实、父版本关系、变更来源和 recovery source
- **依赖谁**：同一 TaskHandle 和当前四材料
- **测试边界**：旧 hash 不阻断开发；旧 run 不被删除或倒填

### 浏览器 QA 与最终验证

- **负责什么**：形成适用 UI AC 的浏览器证据，并汇总最终交付的逐项验证状态
- **对外提供什么**：可定位的浏览器记录和每项 pass、fail、unknown、not_applicable 结论
- **依赖谁**：当前代码 snapshot、测试事实、AC、tasks 和独立 review
- **测试边界**：非 UI 任务不被浏览器证据阻断；audit gap 不改变业务结论

## 7. 关键实体

- **Invocation Fact**：
  - **定义**：证明一个声明组件经过真实宿主调用的 runtime-owned 事实
  - **字段和约束**：绑定 task、stage、run、skill、invocation key、trigger、bundle、outcome 和 snapshot；caller 不可写
  - **关系**：被完成核对引用，但不能由 content evidence、receipt 或 journal 替代

- **Completion Summary**：
  - **定义**：阶段结束时对质量和记录状态的统一说明
  - **字段和约束**：分开表达阶段完整性、代码、测试、AC、review 和 audit gap
  - **关系**：消费 invocation fact 与 business facts；不授予后续开发许可

- **Review Resolution**：
  - **定义**：首次 review finding 被修复、拒绝或接受风险后的追加事实
  - **字段和约束**：保留原 result，绑定 finding、变更、测试、AC 和 disposition
  - **关系**：连接首次 verdict 与 focused verification，不生成替代 pass

- **Material Revision**：
  - **定义**：四材料当前版本的轻量 append-only 元数据
  - **字段和约束**：记录前版、变更文件、摘要、来源和 content hashes
  - **关系**：旧 revision 只读保留；当前 revision 可供后续阶段读取

- **Browser QA Evidence**：
  - **定义**：证明适用 UI 场景真实执行过的统一记录
  - **字段和约束**：绑定页面、场景、工具、登录态、性能、截图、测试结果、cleanup、snapshot 和时间
  - **关系**：只支撑关联 UI AC

- **Verification Item**：
  - **定义**：verify-code 对一个交付维度或 AC 的独立判定
  - **字段和约束**：状态为 pass、fail、unknown 或 not_applicable，附 evidence 或 reason
  - **关系**：核心交付、测试和 AC 共同决定业务结论；audit gap 独立披露

## 8. 数据和生命周期

- **数据粒度**：一次真实组件调用、一次阶段完成核对、一个 review finding resolution、一次四材料 revision、一次浏览器 QA、一个 verification item 各自形成独立记录。
- **数据时效**：记录在对应事实发生时追加；当前 head 或 revision 指向最新有效事实，旧记录不失效为“未发生”。
- **缺失或迟到**：缺失显示 missing、unavailable 或 unknown；允许同一任务后续补做，但不能倒填成旧 run 已执行。
- **预览与正式**：草稿和临时观察不能冒充 runtime-owned fact；只有正式 publication 才能被完成核对消费。
- **当前与历史**：当前材料和 canonical head 可更新；首次 verdict、旧 revisions、旧 runs 与原始字节永久保留。
- **归属与清理**：TaskKernel 持有正式记录；临时测试资源按 QA cleanup 结果清理，正式证据不得因清理失去定位。

## 9. 兼容性预留

- **既有消费方**：旧 review、旧 run、旧 material revision 和 legacy fuzzy 诊断保持可读；不把历史改写成新格式。
- **命名预留**：complete、incomplete、unknown 与 pass、fail、unknown、not_applicable 分属不同判断，避免后续混用。
- **容器预留**：完成摘要允许分别容纳组件、业务结果、review、browser evidence 和 audit gaps。
- **状态预留**：conditional 组件保留 executed 与 `trigger=false + reason`；provider 和 review 保留 unavailable。
- **扩展边界**：可增加新的阶段声明组件或验证项，但不能降低 runtime-owned 真实性，也不能新增全局推进 Gate。

## 10. 明确不做与默认必须成立

### 明确不做

- 不修改 `talk-with-zhipeng` 等具体 Skill 的业务方法；来源 D-01。
- 不增加签名平台、宿主认证、真人阅读证明或新的确认点；来源 D-02、D-03。
- 不造第二套阶段状态机或审计数据库；来源 D-02。
- 不把 invocation 或 audit 历史变成 build-code 或 verify-code 的进入 Gate；来源 D-03、D-04。
- 不因普通材料编辑自动 full review；来源 D-05、D-06、D-10。
- 不用新 pass 覆盖旧 `revise_required`；来源 D-05。
- 不重复 dispatch `wh-review` 内部拥有的 review lenses；来源 D-01。

### 默认必须成立

- 当前四材料缺失或不可读时，停止本次 build-code 或 verify-code 进入并点名缺失项；关联 FR-MAT-002、FR-VER-001、AC-13。
- 正式身份、ref/hash、顺序和核心 publication 结构错绑必须在写边界 fail-loud；关联 FR-COMP-004、AC-04。
- 核心交付、测试、逐 AC、声明 Skill invocation、独立审查事实或交接缺失时，完成状态保持 incomplete 或 unknown；关联 FR-COMP-001、FR-COMP-003、FR-VER-002、AC-03、AC-13、AC-14。
- audit/support missing 或 unavailable 必须可见，但不得改变代码、测试或 AC 结论；关联 FR-COMP-002、FR-VER-002、AC-04、AC-14。
- 首次 review、旧 revision 和错误 run 的原始历史必须保留；关联 FR-REV-001、FR-MAT-004、FR-REC-001、AC-05、AC-09、AC-15。
- 组件 unavailable、review unavailable 和无法测量的性能状态不得伪装 pass；关联 FR-INV-004、FR-BQA-001、FR-VER-003、AC-11、AC-14。

### 合宪边界

- **F1/F2**：core 只编排和核对窄 invocation fact；业务方法留在 Skill。
- **F3/Q2**：推进资格、写入真实性、完成声明分离。
- **F4/Q1/Q3**：真实异源审查保留，finding 不锁死修复，不制造 pass。
- **F5/F10**：不增加认证平台、通用 Gate 或重复 review。
- **F8/F9**：复用现有 resolver/TaskKernel；缺失如实，不假绿。
- **S7/S8**：阶段与 Skill 保持独立、可搬运，宿主只提供真实调用能力。

## 11. 验收标准

- [ ] **AC-01**：五阶段组件清单可由 completion reconcile 对账；只写 payload 或 journal 后仍显示 missing invocation
  - **需求**：FR-INV-001、FR-INV-003、FR-INV-005、FR-COMP-001、FR-COMP-005
  - **验证方法**：分别观察真实调用与仅写观察记录两种阶段结果
  - **通过条件**：声明组件逐项对账，伪记录不能授予 executed
  - **失败条件**：手写记录可完成声明 Skill
  - **证据类型**：`test`

- [ ] **AC-02**：真实宿主调用产生 runtime-owned fact；caller 直接提交同结构被拒绝
  - **需求**：FR-INV-002、FR-INV-003、FR-COMP-005
  - **验证方法**：比较正式调用与 caller 伪造写入的可观察结果
  - **通过条件**：只有真实调用产生有效 invocation fact
  - **失败条件**：caller 可伪造 invoked 或 executed
  - **证据类型**：`test`

- [ ] **AC-03**：缺 invocation 时不能称 complete 或 pass，但仍可编辑四材料、修代码和补测试
  - **需求**：FR-INV-001、FR-INV-004、FR-COMP-001、FR-COMP-002、FR-COMP-003
  - **验证方法**：在 invocation 缺失状态继续材料与代码工作并查看摘要
  - **通过条件**：摘要如实 incomplete，工作路径仍可用
  - **失败条件**：假绿或 process gap 卡死修复
  - **证据类型**：`test`

- [ ] **AC-04**：audit missing 或 unavailable 可见且不影响继续工作；错绑身份与核心 publication 仍写前失败
  - **需求**：FR-COMP-002、FR-COMP-003、FR-COMP-004、FR-VER-002
  - **验证方法**：分别验证 audit 缺失与正式身份错绑
  - **通过条件**：前者只披露，后者 fail-loud 且无部分成功
  - **失败条件**：audit 成为 Gate，或错绑写成功
  - **证据类型**：`test`

- [ ] **AC-05**：首次 `revise_required` 原字节与引用保留；修复后只追加 resolution 与 focused evidence，普通修复 provider 调用数为 0
  - **需求**：FR-REV-001、FR-REV-002、FR-REV-003、FR-MAT-004
  - **验证方法**：对首次 finding 完成修复并核对前后 review lineage
  - **通过条件**：原结果未改写，新记录能解释 finding 处置与验证
  - **失败条件**：覆盖旧结果、强制新 pass 或自动 full review
  - **证据类型**：`test`

- [ ] **AC-06**：同 subject 并发或顺序重复 initial 最多一次 provider dispatch
  - **需求**：FR-REV-002、FR-REV-004
  - **验证方法**：对同一 subject 发起并发与顺序重复请求
  - **通过条件**：复用 canonical head，provider 最多调用一次
  - **失败条件**：重复调用或形成 review 循环
  - **证据类型**：`test`

- [ ] **AC-07**：材料不完整在 provider 前产生 `MATERIAL_INCOMPLETE`，`provider_calls=0`
  - **需求**：FR-REV-005
  - **验证方法**：提交缺 snapshot、subject、required maps 或 anchor 的 review 材料
  - **通过条件**：在 provider 前失败并记录明确原因
  - **失败条件**：缺材料仍调用 provider
  - **证据类型**：`test`

- [ ] **AC-08**：replay 的 profile 或 anchor 缺失、错配时报 `REPLAY_MISMATCH`；legacy fuzzy 不能改变 verdict
  - **需求**：FR-REV-006
  - **验证方法**：覆盖精确匹配、缺失、错配和 legacy fuzzy 四种 replay
  - **通过条件**：只有稳定 identity 精确匹配可复用，新旧 verdict 均不被模糊结果改写
  - **失败条件**：默认 true 或模糊匹配导致误 pass
  - **证据类型**：`test`

- [ ] **AC-09**：更新任意四材料后 current revision 改变且开发可继续，不生成 reopen、reset 或 rebind Gate
  - **需求**：FR-MAT-001、FR-MAT-002、FR-MAT-003、FR-MAT-004
  - **验证方法**：分别更新 decision-log、spec、plan 和 tasks 并读取 current revision
  - **通过条件**：变更与来源可追溯，旧版本只读，后续开发不被阻断
  - **失败条件**：旧 hash 或 checkpoint 阻断，或漏记 decision-log
  - **证据类型**：`test`

- [ ] **AC-10**：requirements ledger 可在同 task 追加新 revision，旧 revision 只读保留
  - **需求**：FR-MAT-003、FR-MAT-005
  - **验证方法**：在同一任务补充 intake 范围并核对 supersede 关系
  - **通过条件**：新旧 ledger 都可追溯且不需要新 TaskHandle
  - **失败条件**：补充范围必须创建新 TaskHandle
  - **证据类型**：`test`

- [ ] **AC-11**：UI 验收记录页面、场景、工具、登录态、性能状态、截图、测试文件、实际命令、结果、exit、cleanup，并绑定当前 snapshot；测试文件不适用时记录实际命令与原因
  - **需求**：FR-BQA-001、FR-BQA-002
  - **验证方法**：执行一个适用 UI AC 并核对统一浏览器证据
  - **通过条件**：所有适用字段可定位，凭据不进入证据
  - **失败条件**：只有“页面测试通过”或证据不可定位
  - **证据类型**：`evidence`

- [ ] **AC-12**：非 UI 任务无需 browser evidence；性能不可测时允许 `not_measured + reason`
  - **需求**：FR-BQA-001、FR-BQA-003
  - **验证方法**：比较非 UI 任务与性能不可测的 UI 任务
  - **通过条件**：两者均如实标注，且不形成全局 Gate
  - **失败条件**：浏览器证据成为所有任务 Gate
  - **证据类型**：`test`

- [ ] **AC-13**：verify-code 每个适用 AC 都有状态与证据；核心交付、测试、AC、tasks 任一缺失不得通过
  - **需求**：FR-COMP-001、FR-COMP-003、FR-VER-001、FR-VER-002
  - **验证方法**：对完整与缺项候选分别执行逐项验证
  - **通过条件**：每个适用项可判定，业务结论与核心事实一致
  - **失败条件**：快速抽查即称 pass
  - **证据类型**：`test`

- [ ] **AC-14**：verify-code 的 audit gap 只披露；review unavailable 不伪造 pass；verify 确认和 close 授权分离
  - **需求**：FR-COMP-002、FR-COMP-003、FR-INV-004、FR-BQA-003、FR-VER-001、FR-VER-002、FR-VER-003
  - **验证方法**：覆盖 audit gap、review unavailable、人工确认和 close 授权
  - **通过条件**：四类事实分别表达，不互相替代
  - **失败条件**：audit 完整性决定业务结论
  - **证据类型**：`test`

- [ ] **AC-15**：旧 run 保留且明确 incomplete；新正式 run 产生真实 invocation facts
  - **需求**：FR-INV-002、FR-INV-004、FR-REC-001、FR-REC-002
  - **验证方法**：从一个漏调组件的旧 run 执行同任务透明恢复
  - **通过条件**：历史未改写，新 run 有 recovery source 与新调用事实
  - **失败条件**：删除、改写、倒填旧历史或不重跑即 accepted
  - **证据类型**：`test`

- [ ] **AC-16**：聚焦 RED/GREEN 覆盖五阶段漏调、conditional skip、host unavailable、重复 review、材料 revision、browser evidence 和 verify incomplete
  - **需求**：FR-INV-001、FR-INV-004、FR-REC-002
  - **验证方法**：核对各风险路径至少有一组先失败后通过的聚焦验证
  - **通过条件**：列出的每类风险都有可复现的 RED/GREEN 证据
  - **失败条件**：只测 make-decision happy path
  - **证据类型**：`evidence`

- [ ] **AC-17**：post-Grill 四材料更新可追加当前 decision receipt 与受控 Grill revalidation；没有新 authenticated invocation 时 aggregate 必须拒绝
  - **需求**：FR-MAT-006
  - **验证方法**：在 detail review 后改变材料树，并分别尝试无调用与真实调用的聚焦 revalidation
  - **通过条件**：仅真实调用绑定新树，原 Talk、Grill 与 review 历史保持不变
  - **失败条件**：旧 Step 9 被重绑或重试，或只写新 evidence 就能伪称完成
  - **证据类型**：`test`

- [ ] **AC-18**：所有 Stage 的 structural resolution 成功且不自动产生 reset；revalidation replacement 只允许 `0002`
  - **需求**：FR-MAT-007
  - **验证方法**：覆盖各 Stage resolution、未完成 `0001`、合法 `0002`、caller 伪造 supersede 和 `0003`
  - **通过条件**：合法 `0002` 自动绑定已完成 `0001`、直接下一版材料和新 invocation，aggregate 继续复用原三轮 Talk
  - **失败条件**：canonical resolution 已写却命令失败、caller 伪造 supersede、未完成 `0001` 即 replacement，或出现 `0003`、重复 Talk 或 provider
  - **证据类型**：`test`

## 12. 风险、未决与交接

- **RISK-01**：本机 provider priority 配置可能阻断独立审查
  - **受影响 ID**：PFACT-08、FR-REV-003、FR-VER-003、AC-14
  - **触发条件**：T013 实际执行独立审查时，provider priority 警告导致调用不可用
  - **后果**：独立审查只能记录 unavailable，不能声明 pass
  - **缓解或 STOP**：先如实报告；只有取得用户对全局配置变更的单独授权后才能修改，禁止静默改动
  - **处理 Stage**：`build-code`
  - **验证**：以 T013 的真实调用结果判断；警告本身不改变当前 FR/AC，也不阻断材料完善

- **RISK-02**：完成核对被误用为推进 Gate
  - **受影响 ID**：PFACT-02、FR-COMP-002、FR-VER-002、AC-03、AC-04、AC-14
  - **触发条件**：实现把 invocation、review 或 audit gap 合并为一个总许可状态
  - **后果**：漏一条记录就卡住修复，或为了推进而伪造 pass
  - **缓解或 STOP**：始终分开可继续工作、正式写入真实和可宣称完成三个谓词
  - **处理 Stage**：`build-code`
  - **验证**：聚焦验证 audit missing、invocation missing 和身份错绑产生三种不同结果

- **RISK-03**：浏览器证据泄露登录凭据或变成全局认证要求
  - **受影响 ID**：PFACT-05、FR-BQA-001、FR-BQA-002、FR-BQA-003、AC-11、AC-12
  - **触发条件**：证据保存凭据内容，或非 UI AC 也被强制要求截图与登录态
  - **后果**：安全信息泄露或无关任务被阻断
  - **缓解或 STOP**：只记录登录态是否复用；仅适用 UI AC 要求 browser evidence
  - **处理 Stage**：`verify-code`
  - **验证**：检查证据字段与非 UI not_applicable 路径

- **OPEN-01**：provider priority 警告是否会真实阻断 T013
  - **受影响 ID**：PFACT-08、FR-REV-003、FR-VER-003、AC-14
  - **owner**：宿主配置所有者
  - **影响**：决定独立审查是正常执行还是如实 unavailable，不改变本需求范围
  - **处理 Stage**：`build-code`
  - **关闭条件或 STOP**：T013 的真实调用结果可关闭；若需改全局配置，未取得用户单独授权前 STOP

## 13. 业务影响与回归范围

### 五阶段完成声明

- **既有行为**：声明步骤可能被 content evidence、receipt 或 journal 间接写成完成
- **本需求影响**：真实 invocation 与完成摘要分开核对，缺失不假绿
- **回归路径**：覆盖 always、conditional skip、unavailable、手写观察和真实宿主调用
- **验收**：AC-01、AC-02、AC-03、AC-04、AC-16

### Review 与材料演进

- **既有行为**：材料变化可能触发重复 full review，旧 hash 或 reset 可能阻断继续工作
- **本需求影响**：保留首次 verdict 和所有历史；普通修复使用 resolution 与 focused verification；四材料直接追加 revision
- **回归路径**：覆盖 revise_required 修复、重复 subject、材料不完整、replay mismatch、四材料更新和 post-Grill revalidation
- **验收**：AC-05 至 AC-10、AC-17、AC-18

### 浏览器 QA 与 verify-code

- **既有行为**：浏览器测试证据不统一，verify-code 可能快速抽查或把审计记录当 Gate
- **本需求影响**：适用 UI AC 使用统一证据；最终验证逐项说明业务结果、缺口和限制
- **回归路径**：覆盖 UI、非 UI、性能未测、audit gap、review unavailable、人工确认和 close 授权
- **验收**：AC-11、AC-12、AC-13、AC-14

### 同任务透明恢复

- **既有行为**：错误 run 可能缺少真实调用却被误认为已完成
- **本需求影响**：旧 run 保留为 incomplete，新 run 从正式入口产生真实调用事实
- **回归路径**：从漏调组件的旧 run 完成同任务重跑
- **验收**：AC-15、AC-16

### 需求来源映射

- **USR-BROWSER** → SCN-006；FR-BQA-001 至 FR-BQA-003；AC-11、AC-12
- **USR-REVIEW-RESOLUTION** → SCN-003；FR-REV-001、FR-REV-002；AC-05
- **USR-MATERIAL-REVISION** → SCN-004；FR-MAT-001 至 FR-MAT-007；AC-09、AC-10、AC-17、AC-18
- **REC-POST-WRITE-RESET** → SCN-003、SCN-004；FR-MAT-007；AC-18
- **USR-VERIFY-DEPTH** → SCN-005；FR-COMP-001 至 FR-COMP-005、FR-VER-001 至 FR-VER-003；AC-03、AC-04、AC-13、AC-14
- **USR-FOCUSED-REVIEW** → SCN-003、SCN-007；FR-REV-001 至 FR-REV-006；AC-05、AC-06、AC-07
- **FG3-09** → SCN-007；FR-REV-006；AC-08
- **FG3-15** → SCN-007；FR-REV-002、FR-REV-004、FR-REV-005；AC-05、AC-06、AC-07
- **REC-QUALITY-FLOW-SKIP** → SCN-001、SCN-002、SCN-008；FR-INV-001 至 FR-INV-005、FR-REC-001、FR-REC-002；AC-01、AC-02、AC-15、AC-16

- **可能受冲击的业务规则**：首次 review、旧 material revision 和错误 run 不可改写；audit/support missing 不得替代业务结论；正式身份错绑必须 fail-loud。
- **明确无影响**：具体 Skill 的业务方法、额外认证平台、第二套状态机和 reviewer-owned lenses 的内部执行方式不在本需求内。
