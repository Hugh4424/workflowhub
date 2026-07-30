# 核心质量流程真实执行与轻量记录规格

## 1. 目标

让 WorkflowHub 五阶段声明的质量动作真实执行、可核对、缺失时不假绿；
同时保持四材料可直接更新、审计不作 Gate、审查不循环。

## 2. 场景

- **SCN-001**：`make-decision` 的 talk/grill/review 经过真实 dispatch；手写 payload 不能完成步骤。
- **SCN-002**：任一阶段结束时核对声明组件；缺失则 incomplete，但允许同任务补做。
- **SCN-003**：首次 `revise_required` 后修复；保留旧结果并追加 resolution + focused verification。
- **SCN-004**：四材料继续更新；后续读取当前 revision，不触发 reopen/reset/full review。
- **SCN-005**：verify-code 完整核对交付、测试、逐 AC、tasks、review 和适用的 UI 证据；audit 缺失仅披露。
- **SCN-006**：浏览器 QA 能回答测了什么、工具、登录态、性能、截图、测试文件和 cleanup。
- **SCN-007**：review replay/aggregation 保留 anchor/profile；普通材料变化不重复 provider 调用。
- **SCN-008**：错误 make-decision run 保留为 incomplete；修复后同任务正式重跑。

## 3. 功能需求

### 3.1 调用真实性

- **FR-INV-001**：统一 dispatch owner 消费五阶段 `skill-deps.yaml`。
  `always` 必须调用；`conditional` 必须记录 executed 或 `trigger=false + reason`。
- **FR-INV-002**：每次真实 `hostInvoke` 由 runtime 追加 invocation fact，
  至少绑定 task/stage/run/skill/invocation key、声明 trigger、bundle hash、
  outcome ref/hash 和 snapshot；caller 不得写入或伪造。
- **FR-INV-003**：content evidence、receipt、journal 和 step exit
  只能证明内容或观察，不能授予 invoked/executed。
- **FR-INV-004**：组件 unavailable 如实记录，不能伪装 pass。
  宿主不支持调用时阶段保持 incomplete/unknown，但同任务修复可继续。
- **FR-INV-005**：reviewer-owned lens 由 `wh-review` 的正式结果证明，
  不得作为 direct component 再次 dispatch。

### 3.2 完成核对与非 Gate

- **语义边界**：业务完成由核心交付、测试和逐 AC 决定；阶段记录完整性由
  invocation、review、handoff 与结构绑定决定。阶段记录不完整必须披露，
  但 review/audit 缺失不得成为 build-code/verify-code 的进入 Gate。

- **FR-COMP-001**：统一 completion reconciler 对照
  `steps.json + skill-deps.yaml + invocation facts + business facts`。
- **FR-COMP-002**：reconcile 只决定能否宣称阶段完整，不作为
  build-code/verify-code 的进入许可证。
- **FR-COMP-003**：summary 分别输出 complete/incomplete/unknown、
  missing/unavailable components、代码/测试/AC/review 状态和 audit gaps。
- **FR-COMP-004**：task/worktree/runtime 身份错绑或核心 publication 结构错误
  在写边界 fail-loud；audit/support 缺失只记录。
- **FR-COMP-005**：手工 `record-step-entry/exit` 保留为 observation/debug，
  不授予真实 invocation 或 complete。

### 3.3 Review 生命周期

- **FR-REV-001**：首次 canonical verdict 永久保留；修复后追加 finding disposition、
  变更 hash、受影响测试和 AC 结果。
- **FR-REV-002**：普通修复、文案补齐、context map 补齐和 tasks 证据填写
  只做 focused verification；不得自动 full review，也不得要求新 pass。
- **FR-REV-003**：每个阶段/候选的首次声明 review 仍须真实执行或如实 unavailable。
  已有 canonical verdict 后，额外语义 review 只由用户明确要求触发；
  它是独立 action，保留父/root lineage，不覆盖旧结果。
- **FR-REV-004**：controller 从 canonical head 查找同 subject 既有结果；
  caller ref 与 head 冲突 fail-loud；同 subject 第二次 initial/full 不调用 provider。
- **FR-REV-005**：provider 前检查 snapshot、subject、required maps 和 anchor；
  不完整写 `MATERIAL_INCOMPLETE`，`provider_calls=0`。
- **FR-REV-006**：replay 使用持久化 `requested_profiles` 与 `evidence_anchor_valid`；
  新记录 finding identity 精确匹配，缺失/错配报 `REPLAY_MISMATCH`。
  legacy fuzzy 仅诊断，不影响 verdict。

### 3.4 四材料更新

- **FR-MAT-001**：四材料更新只追加轻量 revision：
  revision id、previous revision、changed files、change summary、source refs 和 content hashes。
- **FR-MAT-002**：revision 不要求 reopen/reset/rebind/checkpoint/accepted；
  build-code/verify-code 只检查当前四文件可读。
- **FR-MAT-003**：影响 SCN/FR/AC/范围/依赖的修改同步更新来源映射；
  普通说明或证据填写只更新实际涉及文件。
- **FR-MAT-004**：旧 revisions/hashes 保留审计；旧 hash 不阻断开发，
  也不触发自动 full review。
- **FR-MAT-005**：requirements ledger 在同一 task 内支持 append-only revision/supersede，
  不再因 intake 范围补充而要求新 TaskHandle。

### 3.5 浏览器证据

- **FR-BQA-001**：UI acceptance 触发浏览器 QA 时，统一证据记录页面/route、
  场景/AC、工具/引擎、登录态 `reused|fresh|none`、性能指标或
  `not_measured|not_applicable + reason`、截图 refs、测试文件/命令/exit 和 cleanup。
- **FR-BQA-002**：证据绑定当前代码 snapshot 与测试时间；截图/文件必须可定位。
  登录态只记录是否复用，不泄露凭据。
- **FR-BQA-003**：仅适用 UI AC 需要 browser evidence；
  非 UI 任务记录 not_applicable，不形成全局 Gate。

### 3.6 verify-code

- **FR-VER-001**：verify-code 显式拆为：
  当前四材料、实际 diff/交付范围、风险测试、逐 AC、tasks、适用的浏览器证据、
  独立 review/resolution、缺口、交接和验证结果。
- **FR-VER-002**：每项输出 pass/fail/unknown/not_applicable + evidence/reason。
  缺核心交付、测试或 AC 不得宣称通过；audit 缺失不改变业务结论。
- **FR-VER-003**：verify review 是独立质量事实，不是进入 Gate；
  unavailable 如实披露。人类 verify 确认和 close 授权保持分离。

### 3.7 同任务透明恢复

- **FR-REC-001**：错误 run 保留并标记 incomplete；列明缺失的真实 invocations。
- **FR-REC-002**：修复后同一 task 从正式入口重跑；
  新 run 引用旧 run 为 recovery source，但不继承伪 invocation facts。

## 4. 验收标准

- **AC-01**：五阶段组件清单可由 completion reconcile 对账；
  只写 payload/journal 后仍显示 missing invocation。
  **失败条件**：手写记录可完成声明 Skill。
- **AC-02**：真实 hostInvoke 产生 runtime-owned fact；caller 直接提交同结构被拒绝。
  **失败条件**：caller 可伪造 invoked/executed。
- **AC-03**：缺 invocation 时不能称 complete/pass，但仍可编辑四材料、修代码和补测试。
  **失败条件**：假绿或 process gap 卡死修复。
- **AC-04**：audit missing/unavailable 可见且不影响继续工作；
  错绑身份与核心 publication 仍写前失败。
  **失败条件**：audit 成 Gate，或错绑写成功。
- **AC-05**：首次 `revise_required` 原字节/ref 保留；
  修复后仅追加 resolution + focused evidence，普通修复 provider 调用数为 0。
  **失败条件**：覆盖旧结果、强制新 pass 或自动 full review。
- **AC-06**：同 subject 并发/顺序重复 initial 最多一次 provider dispatch。
  **失败条件**：重复调用或循环 review。
- **AC-07**：材料不完整在 provider 前产生 `MATERIAL_INCOMPLETE`，
  `provider_calls=0`。
  **失败条件**：缺材料仍调用 provider。
- **AC-08**：replay 的 profile/anchor 缺失或错配报 `REPLAY_MISMATCH`；
  legacy fuzzy 不能改变 verdict。
  **失败条件**：默认 true 或模糊匹配导致误 pass。
- **AC-09**：更新任意四材料后 current revision 改变且开发可继续，
  不生成 reopen/reset/rebind Gate。
  **失败条件**：旧 hash/checkpoint 阻断或漏记 decision-log。
- **AC-10**：requirements ledger 可同 task 追加新 revision，
  旧 revision 只读保留。
  **失败条件**：补充范围必须创建新 TaskHandle。
- **AC-11**：UI 验收记录页面、场景、工具、登录态、性能状态、
  截图、测试文件/命令/exit、cleanup，并绑定当前 snapshot。
  **失败条件**：只有“页面测试通过”或证据不可定位。
- **AC-12**：非 UI 任务无需 browser evidence；
  性能不可测时允许 `not_measured + reason`。
  **失败条件**：浏览器证据成为所有任务 Gate。
- **AC-13**：verify-code 每个适用 AC 都有状态与证据；
  核心交付、测试、AC、tasks 任一缺失不得通过。
  **失败条件**：快速抽查即称 pass。
- **AC-14**：verify-code 的 audit gap 只披露；review unavailable 不伪造 pass；
  verify 确认和 close 授权分离。
  **失败条件**：audit 完整性决定业务结论。
- **AC-15**：旧 run 保留且明确 incomplete；
  新正式 run 产生真实 invocation facts。
  **失败条件**：删除、改写、倒填旧历史或不重跑即 accepted。
- **AC-16**：聚焦 RED/GREEN 覆盖五阶段漏调、conditional skip、
  host unavailable、重复 review、材料 revision、browser evidence 和 verify incomplete。
  **失败条件**：只测 make-decision happy path。

## 5. 失败语义

- 四材料缺失/不可读：停止本次 build-code/verify-code 进入并点名缺失项。
- 正式身份、绑定或核心 publication 结构不真实：fail-loud，零部分成功。
- 核心交付、测试、逐 AC、声明 Skill invocation、独立审查事实或交接缺失：
  保持 incomplete/unknown。
- audit/support 缺失：记录 missing/unavailable，不转换为业务 fail/pass。

## 6. 需求来源映射

- **USR-BROWSER** → SCN-006；FR-BQA-*；AC-11、AC-12
- **USR-REVIEW-RESOLUTION** → SCN-003；FR-REV-001、002；AC-05
- **USR-MATERIAL-REVISION** → SCN-004；FR-MAT-*；AC-09、AC-10
- **USR-VERIFY-DEPTH** → SCN-005；FR-COMP-*、FR-VER-*；AC-03、04、13、14
- **USR-FOCUSED-REVIEW** → SCN-003、007；FR-REV-*；AC-05、06、07
- **FG3-09** → SCN-007；FR-REV-006；AC-08
- **FG3-15** → SCN-007；FR-REV-002、004、005；AC-05、06、07
- **REC-QUALITY-FLOW-SKIP** → SCN-001、002、008；FR-INV-*、FR-REC-*；AC-01、02、15、16

## 7. 合宪边界

- F1/F2：core 只编排和核对窄 invocation fact；业务方法留在 Skill。
- F3/Q2：推进资格、写入真实性、完成声明分离。
- F4/Q1/Q3：真实异源审查保留，finding 不锁死修复，不制造 pass。
- F5/F10：不增加认证平台、通用 Gate 或重复 review。
- F8/F9：复用现有 resolver/TaskKernel；缺失如实，不假绿。
- S7/S8：阶段与 Skill 保持独立、可搬运，宿主只提供 `hostInvoke`。

## 8. 开放交付风险

- 本机存在 build-code provider priority 配置警告。若该警告在 T013 实际阻断独立审查，
  必须如实报告，并取得用户对全局配置变更的单独授权后才能修改。
- 该风险不改变当前 FR/AC，不影响当前材料继续完善，也不构成开发或验收 Gate。
