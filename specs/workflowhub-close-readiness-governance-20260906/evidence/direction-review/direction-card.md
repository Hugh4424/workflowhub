# Approved Direction Card（方向卡·修订版 v3）— 经 Talk 1-3 + 红蓝审查 + 四队辩论裁决 + detail 审查修正

> 修订依据：debate round-1 裁决书修订清单 1-8；用户 Talk R3 四项确认（T-009~T-012）；detail-advice 39 条 findings 处置（FND-D01~D10，聚合键/字段语义/状态矩阵/观察合同修正）。

## 核心需求与目标

- **核心需求**：诊断 WorkflowHub 历史任务"verify-code 堆积缺口→带缺口 close"的根因（以独立只读核查为准），并落地聚焦治理改造，让收口可行性提前暴露、状态可信。
- **目标**：① 经核实诊断交付（含认知差异说明：任务1 实为标准 close 且用户接受 quality incomplete；M17 为 manual-risk-close delivered_with_risk）；② 聚焦改造落地；③ 本任务后期阶段 dogfood 真实使用新机制（按观察合同）。

## 改造范围（已确认，聚焦；逐项标根因+核查状态）

1. **A+B 收口预检链**（根因："build-plan 只查静态验收卡/收口可行性前移"←✅核查支撑，F-022；"aggregate 太晚"←⚠️未直接核实，并入边界声明）：方向期锁定最小收口合同=9 字段（producer/consumer/owner/命令/fixture/oracle/证据路径/freshness/close 条件，**各字段语义见 decision-log"收口合同 9 字段语义"节**）+覆盖边界声明；载体=spec.md 的 AC 扩展字段（不新增第五材料、不双写；唯一写入者=build-spec 阶段 AC 定义，预检只读消费）；预检=**只读 advisory 三态 ready/unknown/unavailable**（移除 blocked；blocked 语义并入 unavailable+原因），不接触 can_continue/physical_close/close 三义；**覆盖边界**：预检覆盖 build-plan 建卡时已声明的收口合同缺口，后期新缺由 F 状态分层+close 前只读复核暴露；不每阶段重跑。
2. **D 唯一缺口源**（根因："同一缺口多投影/无 current-fact selector/确认断裂"←✅核查支撑，F-013/F-018/F-019）：**gap_id=规范化缺口内容的同快照确定性派生（聚合键不含投影源）**；投影源作为每条投影 provenance 保留（去重仅渲染层）；已确认项消缺（投影消费 human-confirmation）；派生缺口记录绑 snapshot/material、带来源与 owner；现有多投影别名输出收敛到同一派生源（生产者/消费者/移除条件列清单，实现归 build-spec）；不持久、不登记、不承诺跨时间稳定（缺口消失是预期）。
3. **E 边界校验**（根因："内部协议错误在错误边界失败"←✅核查支撑，F-010/F-020/F-021）：bridge 写入 agent_run_id !== attempt_id → 写入时拒绝；测试收据不绑当前 snapshot/material → 写入时拒绝；语义缺失（unavailable/无证据）→ 记录+按缺口投影，不阻断。
4. **F 状态分层**（根因："外部事实缺失分层不清/完成质量两套判定"←✅部分支撑，派生源未共享）：六状态（can_continue/stage_status/quality_status/acceptance_status/product_release_status/physical_close_status）分离展示，**各状态唯一来源/值域/stale 语义见 decision-log"数据状态矩阵"**；quality_status 唯一来源=独立质量决议（预检/收口投影不得写入或推导之）；展示层不得推导新状态机。
5. **C/G 并入**：C（build-code 首 phase 最小 smoke）根因"aggregate 太晚"未独立核查→实施前先验证、可裁剪；G（review 语义收紧：findings:[] 不得绕过 provenance；timeout/cancelled/unavailable 原状态保留；live_unavailable 不得用历史 replay 冒充绿）根因"findings:[] 语义"←✅核查支撑（F-015）。

## 用户流程与展示位（方向级骨架）

- 流程：make-decision → build-spec（AC 收口合同字段填写）→ build-plan（末端预检只读）→ build-code（每 phase 实施/测试/审查；收口期预检重算）→ verify-code（代码审查；dsh-code-review 唯一 code_review 事实）→ confirm/authorize → close（用户明确指令；完成记录抄写质量/发布状态）。
- 展示位：status/close 输出六状态分离；预检输出三态只读；同一 gap 只显示一次；无页面 UI（CLI/JSON 为展示面）。
- 异常态下一步：见 decision-log"失败分支表"（unknown/unavailable/timeout/findings:[] 无 provenance/协议不一致/stale 各定义语义与下一步）。

## 数据状态

- 六状态矩阵（唯一来源/值域/stale 语义/展示位）：见 decision-log"数据状态矩阵"（方向级可执行；完整转换细节归 build-spec）。
- 缺口：同快照确定性派生 id（聚合键=规范化内容）；已确认项消缺；missing/unavailable/stale/conflict 语义保留。
- 收口合同：9 字段+语义沿 AC 记录（spec.md），预检只读消费。

## 非目标（已确认）

- 不改历史任务记录（只读案例）；不重放真实外部任务验证（另立后续任务）；不做页面/前端 UI；不改宪法 close 三义；不新增公共入口/新 store/持久 selector 对象/新 gate/第五材料；外部 provider 不可用时如实记录 unavailable，不伪造通过；不做完整状态矩阵转换表与端到端流程设计（归 build-spec 转译）；不每阶段重跑预检。

## 成功/失败边界

- 成功：诊断=每条根因有可核实出处+认知差异说明；改造=聚焦 4 项落地；**验收=每条已核查根因至少一条可证伪负向夹具/oracle**（映射表见 decision-log"验收细节"：bridge 不匹配拒绝/旧快照收据拒绝/unknown-unavailable 语义保留/findings:[] 无 provenance 不得绕过/确认消缺/六状态独立变化/别名输出收敛）+合成多投影样本；dogfood 按观察合同覆盖后期阶段真实使用面（阶段/样本/独立观察者/窗口/判定）；用户确认。
- 失败：把未核实论断当事实；新增违宪控制面；假绿（findings:[] 绕过、unavailable 改写、旧收据算 fresh）；方向未确认进入 build-spec。

## 风险与延期

- 风险：横跨 5 处周期最长（RISK-002）；dogfood 自证风险（已改负向夹具为主+观察合同，RISK-003）；预检不能提前暴露后期缺口（覆盖边界声明）；detail review 发现 grok/pi 配置身份未绑定（F-030，配置问题不在本任务范围）。
- 延期：DEFERRED-001 预检载体形态（lens vs profile）build-spec 验证；DEFERRED-002 phase 边界归 build-plan；DEFERRED-003 真实任务重放验证另立后续任务；DEFERRED-004 状态矩阵转换表/夹具明细/schema 细节归 build-spec/build-plan。

## 主要依据

- 用户 Talk 1-3（T-001~T-012）；红蓝方向审查 23 条（result.json）；四队辩论裁决书（7 组）；detail 审查 39 条（result.json + FND-D 处置）；核查事实（F-010~F-030）；宪法硬约束（Q2/Q3/F8/F9/F10/F11；AGENTS.md vNext 边界）。
